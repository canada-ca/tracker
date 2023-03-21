import { GraphQLNonNull, GraphQLList, GraphQLID, GraphQLBoolean } from 'graphql'
import { mutationWithClientMutationId, fromGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

import { removeDomainUnion } from '../unions'
import { Domain } from '../../scalars'
import { logActivity } from '../../audit-logs/mutations/log-activity'

export const addOrganizationsDomains = new mutationWithClientMutationId({
  name: 'AddOrganizationsDomains',
  description: 'Mutation used to create a new domain for an organization.',
  inputFields: () => ({
    orgId: {
      type: GraphQLNonNull(GraphQLID),
      description:
        'The global id of the organization you wish to assign this domain to.',
    },
    domains: {
      type: new GraphQLList(Domain),
      description: 'Url that you would like to be added to the database.',
    },
    hideNewDomains: {
      type: GraphQLBoolean,
      description: 'New domains will be hidden.',
    },
    tagNewDomains: {
      type: GraphQLBoolean,
      description: 'New domains will be tagged with NEW.',
    },
    audit: {
      type: GraphQLBoolean,
      description: 'Audit logs will be created.',
    },
  }),
  outputFields: () => ({
    result: {
      type: removeDomainUnion,
      description:
        '`RemoveDomainUnion` returning either a `DomainResultType`, or `DomainErrorType` object.',
      resolve: (payload) => payload,
    },
  }),
  mutateAndGetPayload: async (
    args,
    {
      i18n,
      request,
      query,
      collections,
      transaction,
      userKey,
      //   publish,
      auth: {
        checkPermission,
        saltedHash,
        userRequired,
        verifiedRequired,
        tfaRequired,
      },
      loaders: { loadDomainByDomain, loadOrgByKey },
      validators: { cleanseInput },
    },
  ) => {
    // Get User
    const user = await userRequired()

    verifiedRequired({ user })
    tfaRequired({ user })

    // Cleanse input
    const { type: _orgType, id: orgId } = fromGlobalId(cleanseInput(args.orgId))

    let domains
    if (typeof args.domains !== 'undefined') {
      domains = args.domains.map((domain) => cleanseInput(domain))
    } else {
      domains = []
    }

    let hideNewDomains
    if (typeof args.hideNewDomains !== 'undefined') {
      hideNewDomains = args.hideNewDomains
    } else {
      hideNewDomains = false
    }

    let tagNewDomains
    if (typeof args.tagNewDomains !== 'undefined') {
      tagNewDomains = args.tagNewDomains
    } else {
      tagNewDomains = false
    }
    let tags = []
    if (tagNewDomains) {
      tags = [{ en: 'NEW', fr: 'NOUVEAU' }]
    }

    let audit
    if (typeof args.audit !== 'undefined') {
      audit = args.audit
    } else {
      audit = false
    }

    // Check to see if org exists
    const org = await loadOrgByKey.load(orgId)

    if (typeof org === 'undefined') {
      console.warn(
        `User: ${userKey} attempted to create a domain to an organization: ${orgId} that does not exist.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(
          t`Unable to create domain in unknown organization.`,
        ),
      }
    }

    // Check to see if user belongs to org
    const permission = await checkPermission({ orgId: org._id })

    if (permission !== 'admin' && permission !== 'super_admin') {
      console.warn(
        `User: ${userKey} attempted to create a domain in: ${org.slug}, however they do not have permission to do so.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(
          t`Permission Denied: Please contact organization user for help with creating domain.`,
        ),
      }
    }

    const updatedProperties = []
    if (typeof tags !== 'undefined' && tags.length > 0) {
      updatedProperties.push({
        name: 'tags',
        oldValue: [],
        newValue: tags,
      })
    }
    if (hideNewDomains) {
      updatedProperties.push({
        name: 'hidden',
        oldValue: null,
        newValue: hideNewDomains,
      })
    }

    // Setup Transaction
    const trx = await transaction(collections)
    let domainCount = 0

    for (const domain of domains) {
      const insertDomain = {
        domain: domain.toLowerCase(),
        lastRan: null,
        selectors: [],
        hash: saltedHash(domain.toLowerCase()),
        status: {
          dkim: null,
          dmarc: null,
          https: null,
          spf: null,
          ssl: null,
        },
        archived: false,
      }

      // Check to see if domain already belongs to same org
      let checkDomainCursor
      try {
        checkDomainCursor = await query`
        WITH claims, domains, organizations
        LET domainIds = (FOR domain IN domains FILTER domain.domain == ${insertDomain.domain} RETURN { id: domain._id })
        FOR domainId IN domainIds
          LET domainEdges = (FOR v, e IN 1..1 ANY domainId.id claims RETURN { _from: e._from })
            FOR domainEdge IN domainEdges
              LET org = DOCUMENT(domainEdge._from)
              FILTER org._key == ${org._key}
              RETURN MERGE({ _id: org._id, _key: org._key, _rev: org._rev }, TRANSLATE(${request.language}, org.orgDetails))
      `
      } catch (err) {
        console.error(
          `Database error occurred while running check to see if domain already exists in an org: ${err}`,
        )
        continue
      }

      let checkOrgDomain
      try {
        checkOrgDomain = await checkDomainCursor.next()
      } catch (err) {
        console.error(
          `Cursor error occurred while running check to see if domain already exists in an org: ${err}`,
        )
        continue
      }

      if (typeof checkOrgDomain !== 'undefined') {
        console.warn(
          `User: ${userKey} attempted to create a domain for: ${org.slug}, however that org already has that domain claimed.`,
        )
        continue
      }

      // Check to see if domain already exists in db
      const checkDomain = await loadDomainByDomain.load(insertDomain.domain)

      let insertedDomainCursor
      if (typeof checkDomain === 'undefined') {
        try {
          insertedDomainCursor = await trx.step(
            () =>
              query`
            WITH domains
            INSERT ${insertDomain} INTO domains
            RETURN MERGE(
              {
                id: NEW._key,
                _type: "domain"
              },
              NEW
            )
          `,
          )
        } catch (err) {
          console.error(
            `Transaction step error occurred for user: ${userKey} when inserting new domain: ${err}`,
          )
          continue
        }

        let insertedDomain
        try {
          insertedDomain = await insertedDomainCursor.next()
        } catch (err) {
          console.error(
            `Cursor error occurred for user: ${userKey} after inserting new domain and gathering its domain info: ${err}`,
          )
          continue
        }

        try {
          await trx.step(
            () =>
              query`
            WITH claims
            INSERT {
              _from: ${org._id},
              _to: ${insertedDomain._id},
              tags: ${tags},
              hidden: ${hideNewDomains}
            } INTO claims
          `,
          )
        } catch (err) {
          console.error(
            `Transaction step error occurred for user: ${userKey} when inserting new domain edge: ${err}`,
          )
          continue
        }
      } else {
        try {
          await trx.step(
            () =>
              query`
            WITH claims
            INSERT {
              _from: ${org._id},
              _to: ${checkDomain._id},
              tags: ${tags},
              hidden: ${hideNewDomains}
            } INTO claims
          `,
          )
        } catch (err) {
          console.error(
            `Transaction step error occurred for user: ${userKey} when inserting domain edge: ${err}`,
          )
          continue
        }
      }

      try {
        await trx.commit()
      } catch (err) {
        console.error(
          `Transaction commit error occurred while user: ${userKey} was creating domains: ${err}`,
        )
        throw new Error(i18n._(t`Unable to create domains. Please try again.`))
      }

      console.info(
        `User: ${userKey} successfully created domains in org: ${org.slug}.`,
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
          },
          action: 'add',
          target: {
            resource: insertDomain.domain,
            updatedProperties,
            organization: {
              id: org._key,
              name: org.name,
            }, // name of resource being acted upon
            resourceType: 'domain', // user, org, domain
          },
        })
      }
      domainCount += 1
    }

    if (!audit) {
      await logActivity({
        transaction,
        collections,
        query,
        initiatedBy: {
          id: user._key,
          userName: user.userName,
          role: permission,
        },
        action: 'add',
        target: {
          resource: `${domainCount} domains`,
          updatedProperties,
          organization: {
            id: org._key,
            name: org.name,
          }, // name of resource being acted upon
          resourceType: 'domain', // user, org, domain
        },
      })
    }

    return {
      _type: 'result',
      status: i18n._(
        t`Successfully added ${domainCount} domains from ${org.slug}.`,
      ),
    }
  },
})
