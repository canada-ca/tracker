import { GraphQLNonNull, GraphQLID, GraphQLBoolean, GraphQLList } from 'graphql'
import { mutationWithClientMutationId, fromGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

import { bulkModifyDomainsUnion } from '../unions'
import { logActivity } from '../../audit-logs/mutations/log-activity'
import { Domain } from '../../scalars'

export const removeOrganizationsDomains = new mutationWithClientMutationId({
  name: 'RemoveOrganizationsDomains',
  description: 'This mutation allows the removal of unused domains.',
  inputFields: () => ({
    domains: {
      type: new GraphQLNonNull(new GraphQLList(Domain)),
      description: 'Domains you wish to remove from the organization.',
    },
    orgId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The organization you wish to remove the domain from.',
    },
    archiveDomains: {
      type: GraphQLBoolean,
      description: 'Domains will be archived.',
    },
    audit: {
      type: GraphQLBoolean,
      description: 'Audit logs will be created.',
    },
  }),
  outputFields: () => ({
    result: {
      type: new GraphQLNonNull(bulkModifyDomainsUnion),
      description: '`BulkModifyDomainsUnion` returning either a `DomainBulkResult`, or `DomainErrorType` object.',
      resolve: (payload) => payload,
    },
  }),
  mutateAndGetPayload: async (
    args,
    {
      i18n,
      query,
      collections,
      transaction,
      userKey,
      request: { ip },
      auth: { checkPermission, userRequired, verifiedRequired, tfaRequired },
      validators: { cleanseInput },
      loaders: { loadDomainByDomain, loadOrgByKey },
    },
  ) => {
    // Get User
    const user = await userRequired()

    verifiedRequired({ user })
    tfaRequired({ user })

    // Cleanse Input
    let domains
    if (typeof args.domains !== 'undefined') {
      domains = args.domains.map((domain) => cleanseInput(domain))
    } else {
      domains = []
    }
    const { type: _orgType, id: orgId } = fromGlobalId(cleanseInput(args.orgId))

    let audit
    if (typeof args.audit !== 'undefined') {
      audit = args.audit
    } else {
      audit = false
    }

    let archiveDomains
    if (typeof args.archiveDomains !== 'undefined') {
      archiveDomains = args.archiveDomains
    } else {
      archiveDomains = false
    }

    // Get Org from db
    const org = await loadOrgByKey.load(orgId)

    // Check to see if org exists
    if (typeof org === 'undefined') {
      console.warn(
        `User: ${userKey} attempted to remove domains in org: ${orgId} however there is no organization associated with that id.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to remove domains from unknown organization.`),
      }
    }

    // Get permission
    const permission = await checkPermission({ orgId: org._id })

    // Check to see if domain belongs to verified check org
    if (org.verified && permission !== 'super_admin') {
      console.warn(
        `User: ${userKey} attempted to remove domains in ${org.slug} but does not have permission to remove a domain from a verified check org.`,
      )
      return {
        _type: 'error',
        code: 403,
        description: i18n._(t`Permission Denied: Please contact super admin for help with removing domain.`),
      }
    }

    if (permission !== 'super_admin' && permission !== 'admin') {
      console.warn(
        `User: ${userKey} attempted to remove domains in ${org.slug} however they do not have permission in that org.`,
      )
      return {
        _type: 'error',
        code: 403,
        description: i18n._(t`Permission Denied: Please contact organization admin for help with removing domains.`),
      }
    }

    if (archiveDomains && permission !== 'super_admin') {
      console.warn(
        `User: ${userKey} attempted to archive domains in ${org.slug} however they do not have permission in that org.`,
      )
      return {
        _type: 'error',
        code: 403,
        description: i18n._(t`Permission Denied: Please contact organization admin for help with archiving domains.`),
      }
    }

    let domainCount = 0

    for (const domain of domains) {
      // Setup Transaction
      const trx = await transaction(collections)

      // Get domain from db
      const checkDomain = await loadDomainByDomain.load(domain)

      // Check to see if domain exists
      if (typeof checkDomain === 'undefined') {
        console.warn(`User: ${userKey} attempted to remove ${domain} however no domain is associated with that id.`)
        continue
      }

      if (archiveDomains && permission === 'super_admin') {
        // Archive Domain
        try {
          await trx.step(
            () => query`
                UPDATE ${checkDomain} WITH { archived: true } IN domains
            `,
          )

          if (audit) {
            await logActivity({
              transaction,
              collections,
              query,
              initiatedBy: {
                id: user._key,
                userName: user.userName,
                role: permission,
                ipAddress: ip,
              },
              action: 'update',
              target: {
                resource: `${domains.length} domains`,
                updatedProperties: [
                  {
                    name: 'archived',
                    oldValue: checkDomain?.archived,
                    newValue: true,
                  },
                ],
                organization: {
                  id: org._key,
                  name: org.name,
                }, // name of resource being acted upon
                resourceType: 'domain', // user, org, domain
              },
            })
          }
        } catch (err) {
          console.error(
            `Database error occurred for user: ${userKey} when attempting to archive domain: ${domain}, error: ${err}`,
          )
          await trx.abort()
          continue
        }
      } else {
        // Check to see if more than one organization has a claim to this domain
        let countCursor
        try {
          countCursor = await query`
          WITH claims, domains, organizations
          FOR v, e IN 1..1 ANY ${checkDomain._id} claims
            RETURN v
        `
        } catch (err) {
          console.error(
            `Database error occurred for user: ${userKey}, when counting domain claims for domain: ${checkDomain.domain}, error: ${err}`,
          )
          await trx.abort()
          continue
        }

        // check if org has claim to domain
        const orgsClaimingDomain = await countCursor.all()
        const orgHasDomainClaim = orgsClaimingDomain.some((orgVertex) => {
          return orgVertex._id === org._id
        })

        if (!orgHasDomainClaim) {
          console.error(
            `Error occurred for user: ${userKey}, when attempting to remove domain "${domain}" from organization with slug "${org.slug}". Organization does not have claim for domain.`,
          )
          await trx.abort()
          continue
        }

        // check to see if org removing domain has ownership
        let dmarcCountCursor
        try {
          dmarcCountCursor = await query`
          WITH domains, organizations, ownership
            FOR v IN 1..1 OUTBOUND ${org._id} ownership
              FILTER v._id == ${checkDomain._id}
              RETURN true
        `
        } catch (err) {
          console.error(
            `Database error occurred for user: ${userKey}, when counting ownership claims for domain: ${checkDomain.domain}, error: ${err}`,
          )
          await trx.abort()
          continue
        }

        if (dmarcCountCursor.count === 1) {
          try {
            await trx.step(
              () => query`
              WITH ownership, organizations, domains, dmarcSummaries, domainsToDmarcSummaries
              LET dmarcSummaryEdges = (
                FOR v, e IN 1..1 OUTBOUND ${checkDomain._id} domainsToDmarcSummaries
                  RETURN { edgeKey: e._key, dmarcSummaryId: e._to }
              )
              LET removeDmarcSummaryEdges = (
                FOR dmarcSummaryEdge IN dmarcSummaryEdges
                  REMOVE dmarcSummaryEdge.edgeKey IN domainsToDmarcSummaries
                  OPTIONS { waitForSync: true }
              )
              LET removeDmarcSummary = (
                FOR dmarcSummaryEdge IN dmarcSummaryEdges
                  LET key = PARSE_IDENTIFIER(dmarcSummaryEdge.dmarcSummaryId).key
                  REMOVE key IN dmarcSummaries
                  OPTIONS { waitForSync: true }
              )
              RETURN true
            `,
            )
          } catch (err) {
            console.error(
              `Trx step error occurred when removing dmarc summary data for user: ${userKey} while attempting to remove domain: ${checkDomain.domain}, error: ${err}`,
            )
            await trx.abort()
            continue
          }

          try {
            await trx.step(
              () => query`
              WITH ownership, organizations, domains
              LET domainEdges = (
                FOR v, e IN 1..1 INBOUND ${checkDomain._id} ownership
                  REMOVE e._key IN ownership
                  OPTIONS { waitForSync: true }
              )
              RETURN true
            `,
            )
          } catch (err) {
            console.error(
              `Trx step error occurred when removing ownership data for user: ${userKey} while attempting to remove domain: ${checkDomain.domain}, error: ${err}`,
            )
            await trx.abort()
            continue
          }
        }

        if (countCursor.count <= 1) {
          // Remove scan data

          try {
            // Remove web data
            await trx.step(async () => {
              await query`
            WITH web, webScan, domains
            FOR webV, domainsWebEdge IN 1..1 OUTBOUND ${domain._id} domainsWeb
              LET removeWebScansQuery = (
                  FOR webScanV, webToWebScansV In 1..1 OUTBOUND webV._id webToWebScans
                    REMOVE webScanV IN webScan
                    REMOVE webToWebScansV IN webToWebScans
                    OPTIONS { waitForSync: true }
              )
              REMOVE webV IN web
              REMOVE domainsWebEdge IN domainsWeb
              OPTIONS { waitForSync: true }
          `
            })
          } catch (err) {
            console.error(
              `Trx step error occurred while user: ${userKey} attempted to remove web data for ${domain.domain} in org: ${org.slug}, error: ${err}`,
            )
            await trx.abort()
            continue
          }

          try {
            // Remove DNS data
            await trx.step(async () => {
              await query`
            WITH dns, domains
            FOR dnsV, domainsDNSEdge IN 1..1 OUTBOUND ${domain._id} domainsDNS
              REMOVE dnsV IN dns
              REMOVE domainsDNSEdge IN domainsDNS
              OPTIONS { waitForSync: true }
          `
            })
          } catch (err) {
            console.error(
              `Trx step error occurred while user: ${userKey} attempted to remove DNS data for ${domain.domain} in org: ${org.slug}, error: ${err}`,
            )
            await trx.abort()
            continue
          }

          try {
            // Remove domain
            await trx.step(async () => {
              await query`
              FOR claim IN claims
                FILTER claim._to == ${checkDomain._id}
                REMOVE claim IN claims
              REMOVE ${checkDomain} IN domains
            `
            })
          } catch (err) {
            console.error(
              `Trx step error occurred while user: ${userKey} attempted to remove domain ${checkDomain.domain} in org: ${org.slug}, error: ${err}`,
            )
            await trx.abort()
            continue
          }
        } else {
          try {
            await trx.step(async () => {
              await query`
              WITH claims, domains, organizations
              LET domainEdges = (FOR v, e IN 1..1 INBOUND ${checkDomain._id} claims RETURN { _key: e._key, _from: e._from, _to: e._to })
              LET edgeKeys = (
                FOR domainEdge IN domainEdges
                  FILTER domainEdge._to ==  ${checkDomain._id}
                  FILTER domainEdge._from == ${org._id}
                  RETURN domainEdge._key
              )
              FOR edgeKey IN edgeKeys
                REMOVE edgeKey IN claims
                OPTIONS { waitForSync: true }
            `
            })
          } catch (err) {
            console.error(
              `Trx step error occurred while user: ${userKey} attempted to remove claim for ${checkDomain.domain} in org: ${org.slug}, error: ${err}`,
            )
            await trx.abort()
            continue
          }
        }

        // Commit transaction
        try {
          await trx.commit()
        } catch (err) {
          console.error(
            `Trx commit error occurred while user: ${userKey} attempted to remove domains in org: ${org.slug}, error: ${err}`,
          )
          await trx.abort()
          continue
        }

        if (audit) {
          console.info(`User: ${userKey} successfully removed domain: ${domain} from org: ${org.slug}.`)
          await logActivity({
            transaction,
            collections,
            query,
            initiatedBy: {
              id: user._key,
              userName: user.userName,
              role: permission,
              ipAddress: ip,
            },
            action: 'remove',
            target: {
              resource: checkDomain.domain,
              organization: {
                id: org._key,
                name: org.name,
              },
              resourceType: 'domain',
            },
          })
        }
      }
      domainCount += 1
    }

    // Log activity
    if (!audit) {
      console.info(`User: ${userKey} successfully removed ${domainCount} domain(s) from org: ${org.slug}.`)
      if (archiveDomains) {
        await logActivity({
          transaction,
          collections,
          query,
          initiatedBy: {
            id: user._key,
            userName: user.userName,
            role: permission,
            ipAddress: ip,
          },
          action: 'update',
          target: {
            resource: `${domainCount} domains`,
            updatedProperties: [
              {
                name: 'archived',
                oldValue: false,
                newValue: true,
              },
            ],
            organization: {
              id: org._key,
              name: org.name,
            },
            resourceType: 'domain',
          },
        })
      } else {
        await logActivity({
          transaction,
          collections,
          query,
          initiatedBy: {
            id: user._key,
            userName: user.userName,
            role: permission,
            ipAddress: ip,
          },
          action: 'remove',
          target: {
            resource: `${domainCount} domains`,
            organization: {
              id: org._key,
              name: org.name,
            },
            resourceType: 'domain',
          },
        })
      }
    }

    return {
      _type: 'result',
      status: i18n._(t`Successfully removed ${domainCount} domain(s) from ${org.slug}.`),
    }
  },
})
