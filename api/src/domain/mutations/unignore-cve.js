import { GraphQLID, GraphQLNonNull } from 'graphql'
import { fromGlobalId, mutationWithClientMutationId } from 'graphql-relay'
import { t } from '@lingui/macro'

import { CveID } from '../../scalars'
import { ignoreCveUnion } from '../unions/ignore-cve-union'
import { logActivity } from '../../audit-logs'

export const unignoreCve = new mutationWithClientMutationId({
  name: 'UnignoreCve',
  description: 'Unignore a CVE for a domain.',
  inputFields: () => ({
    domainId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The global id of the domain which is unignoring the CVE.',
    },
    ignoredCve: {
      description: 'The CVE ID that is being ignored.',
      type: CveID,
    },
  }),
  outputFields: () => ({
    result: {
      type: ignoreCveUnion,
      description: '`IgnoreCveUnion` returning either a `Domain` or an error',
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
      auth: { userRequired, checkSuperAdmin, superAdminRequired, verifiedRequired, tfaRequired },
      validators: { cleanseInput },
      loaders: { loadDomainByKey },
    },
  ) => {
    // Get User
    const user = await userRequired()
    verifiedRequired({ user })
    tfaRequired({ user })

    // Only super admins can ignore CVEs
    const isSuperAdmin = await checkSuperAdmin()
    superAdminRequired({ user, isSuperAdmin })

    const { id: domainId } = fromGlobalId(cleanseInput(args.domainId))

    const ignoredCve = cleanseInput(args.ignoredCve)

    // Check to see if domain exists
    const domain = await loadDomainByKey.load(domainId)

    if (typeof domain === 'undefined') {
      console.warn(`User: "${userKey}" attempted to unignore CVE "${ignoredCve}" on unknown domain: "${domainId}".`)
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to stop ignoring CVE. Please try again.`),
      }
    }

    const oldIgnoredCves = domain.ignoredCves

    if (!oldIgnoredCves.includes(ignoredCve)) {
      console.warn(
        `User: "${userKey}" attempted to unignore CVE "${ignoredCve}" on domain: "${domainId}" however CVE is not ignored.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`CVE is not ignored for this domain.`),
      }
    }

    const newIgnoredCves = Array.from(new Set([...oldIgnoredCves.filter((cve) => cve !== ignoredCve)]))

    // Setup Transaction
    const trx = await transaction(collections)

    try {
      await trx.step(
        async () =>
          await query`
          UPSERT { _key: ${domain._key} }
            INSERT ${{ ignoredCves: newIgnoredCves }}
            UPDATE ${{ ignoredCves: newIgnoredCves }}
            IN domains
      `,
      )
    } catch (err) {
      console.error(
        `Transaction step error occurred when user: "${userKey}" attempted to unignore CVE "${ignoredCve}" on domain "${domainId}", error: ${err}`,
      )
      await trx.abort()
      throw new Error(i18n._(t`Unable to stop ignoring CVE. Please try again.`))
    }

    let currentDomainVulnerabilities
    try {
      currentDomainVulnerabilities = await (
        await trx.step(
          () => query`
        FOR finding IN additionalFindings
          FILTER finding.domain == ${domain._id}
          LIMIT 1
          RETURN UNIQUE(
            FOR wc IN finding.webComponents
              FILTER LENGTH(wc.WebComponentCves) > 0
              FOR vuln IN wc.WebComponentCves
                FILTER vuln.Cve NOT IN ${newIgnoredCves}
                RETURN vuln.Cve
          )
      `,
        )
      ).next()
    } catch (err) {
      console.error(
        `Transaction step error occurred when user: "${userKey}" attempted to unignore CVE "${ignoredCve}" on domain "${domainId}" when getting current CVEs, error: ${err}`,
      )
      await trx.abort()
      throw new Error(i18n._(t`Unable to stop ignoring CVE. Please try again.`))
    }

    try {
      await trx.step(
        () =>
          query`
          UPDATE { _key: ${domain._key}, cveDetected: ${currentDomainVulnerabilities.length > 0} } IN domains
      `,
      )
    } catch (err) {
      console.error(
        `Transaction step error occurred when user: "${userKey}" attempted to unignore CVE "${ignoredCve}" on domain "${domainId}" when updating domain, error: ${err}`,
      )
      await trx.abort()
      throw new Error(i18n._(t`Unable to stop ignoring CVE. Please try again.`))
    }

    // Commit transaction
    try {
      await trx.commit()
    } catch (err) {
      console.error(
        `Transaction commit error occurred when user: "${userKey}" attempted to unignore CVE "${ignoredCve}" on domain "${domainId}", error: ${err}`,
      )
      await trx.abort()
      throw new Error(i18n._(t`Unable to stop ignoring CVE. Please try again.`))
    }

    // Get all verified claims to domain and activityLog those organizations
    try {
      const orgs = await query`
      FOR v, e IN 1..1 INBOUND ${domain._id} claims
        FILTER v.verified == true
        RETURN {
          _key: v._key,
          name: v.orgDetails.en.orgName,
        }
    `
      for await (const org of orgs) {
        await logActivity({
          transaction,
          collections,
          query,
          initiatedBy: {
            id: user._key,
            userName: user.userName,
            role: 'super_admin',
          },
          action: 'update',
          target: {
            resource: domain.domain,
            organization: {
              id: org._key,
              name: org.name,
            },
            resourceType: 'domain',
            updatedProperties: [
              {
                name: ignoredCve,
                oldValue: 'ignored',
                newValue: 'unignored',
              },
            ],
          },
        })
      }
      // Log activity for super admin logging
      await logActivity({
        transaction,
        collections,
        query,
        initiatedBy: {
          id: user._key,
          userName: user.userName,
          role: 'super_admin',
        },
        action: 'update',
        target: {
          resource: domain.domain,
          resourceType: 'domain',
          updatedProperties: [
            {
              name: ignoredCve,
              oldValue: 'ignored',
              newValue: 'unignored',
            },
          ],
        },
      })
    } catch (err) {
      console.error(
        `Database error occurred when user: "${userKey}" attempted to unignore CVE "${ignoredCve}" on domain "${domainId}" during activity logs, error: ${err}`,
      )
    }

    // Clear dataloader and load updated domain
    await loadDomainByKey.clear(domain._key)
    const returnDomain = await loadDomainByKey.load(domain._key)

    console.info(`User: "${userKey}" successfully unignored CVE "${ignoredCve}" on domain: "${domainId}".`)

    returnDomain.id = returnDomain._key

    return {
      ...returnDomain,
    }
  },
})
