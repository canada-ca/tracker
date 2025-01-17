import { GraphQLNonNull, GraphQLList, GraphQLID, GraphQLBoolean } from 'graphql'
import { mutationWithClientMutationId, fromGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

import { createDomainUnion } from '../unions'
import { Domain } from '../../scalars'
import { logActivity } from '../../audit-logs/mutations/log-activity'
import { inputTag } from '../inputs/domain-tag'
import { AssetStateEnums } from '../../enums'

export const createDomain = new mutationWithClientMutationId({
  name: 'CreateDomain',
  description: 'Mutation used to create a new domain for an organization.',
  inputFields: () => ({
    orgId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The global id of the organization you wish to assign this domain to.',
    },
    domain: {
      type: new GraphQLNonNull(Domain),
      description: 'Url that you would like to be added to the database.',
    },
    tags: {
      description: 'List of labelled tags users have applied to the domain.',
      type: new GraphQLList(inputTag),
    },
    archived: {
      description: 'Value that determines if the domain is excluded from the scanning process.',
      type: GraphQLBoolean,
    },
    assetState: {
      description: 'Value that determines how the domain relates to the organization.',
      type: new GraphQLNonNull(AssetStateEnums),
    },
  }),
  outputFields: () => ({
    result: {
      type: createDomainUnion,
      description: '`CreateDomainUnion` returning either a `Domain`, or `CreateDomainError` object.',
      resolve: (payload) => payload,
    },
  }),
  mutateAndGetPayload: async (
    args,
    {
      i18n,
      request,
      query,
      language,
      collections,
      transaction,
      userKey,
      publish,
      auth: { checkPermission, saltedHash, userRequired, tfaRequired, verifiedRequired },
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
    const domain = cleanseInput(args.domain)

    let tags
    if (typeof args.tags !== 'undefined') {
      tags = args.tags
    } else {
      tags = []
    }

    let archived
    if (typeof args.archived !== 'undefined') {
      archived = args.archived
    } else {
      archived = false
    }

    let assetState
    if (typeof args.assetState !== 'undefined') {
      assetState = cleanseInput(args.assetState)
    } else {
      assetState = ''
    }

    // Check to see if org exists
    const org = await loadOrgByKey.load(orgId)

    if (typeof org === 'undefined') {
      console.warn(`User: ${userKey} attempted to create a domain to an organization: ${orgId} that does not exist.`)
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to create domain in unknown organization.`),
      }
    }

    // Check to see if user belongs to org
    const permission = await checkPermission({ orgId: org._id })

    if (!['admin', 'owner', 'super_admin'].includes(permission)) {
      console.warn(
        `User: ${userKey} attempted to create a domain in: ${org.slug}, however they do not have permission to do so.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Permission Denied: Please contact organization user for help with creating domain.`),
      }
    }

    const insertDomain = {
      domain: domain.toLowerCase(),
      lastRan: null,
      hash: saltedHash(domain.toLowerCase()),
      status: {
        certificates: 'info',
        ciphers: 'info',
        curves: 'info',
        dkim: 'info',
        dmarc: 'info',
        hsts: 'info',
        https: 'info',
        protocols: 'info',
        spf: 'info',
        ssl: 'info',
      },
      archived: archived,
      ignoreRua: false,
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
      console.error(`Database error occurred while running check to see if domain already exists in an org: ${err}`)
      throw new Error(i18n._(t`Unable to create domain. Please try again.`))
    }

    let checkOrgDomain
    try {
      checkOrgDomain = await checkDomainCursor.next()
    } catch (err) {
      console.error(`Cursor error occurred while running check to see if domain already exists in an org: ${err}`)
      throw new Error(i18n._(t`Unable to create domain. Please try again.`))
    }

    if (typeof checkOrgDomain !== 'undefined') {
      console.warn(
        `User: ${userKey} attempted to create a domain for: ${org.slug}, however that org already has that domain claimed.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to create domain, organization has already claimed it.`),
      }
    }

    // Setup Transaction
    const trx = await transaction(collections)

    let domainCursor
    try {
      domainCursor = await trx.step(
        () =>
          query`
            UPSERT { domain: ${insertDomain.domain} }
              INSERT ${insertDomain}
              UPDATE { }
              IN domains
              RETURN NEW
          `,
      )
    } catch (err) {
      console.error(`Transaction step error occurred for user: ${userKey} when inserting new domain: ${err}`)
      await trx.abort()
      throw new Error(i18n._(t`Unable to create domain. Please try again.`))
    }

    let insertedDomain
    try {
      insertedDomain = await domainCursor.next()
    } catch (err) {
      console.error(`Cursor error occurred for user: ${userKey} when inserting new domain: ${err}`)
      await trx.abort()
      throw new Error(i18n._(t`Unable to create domain. Please try again.`))
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
              assetState: ${assetState},
              firstSeen: ${new Date().toISOString()},
            } INTO claims
          `,
      )
    } catch (err) {
      console.error(`Transaction step error occurred for user: ${userKey} when inserting new domain edge: ${err}`)
      await trx.abort()
      throw new Error(i18n._(t`Unable to create domain. Please try again.`))
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(`Transaction commit error occurred while user: ${userKey} was creating domain: ${err}`)
      await trx.abort()
      throw new Error(i18n._(t`Unable to create domain. Please try again.`))
    }

    // Clear dataloader incase anything was updated or inserted into domain
    await loadDomainByDomain.clear(insertDomain.domain)
    const returnDomain = await loadDomainByDomain.load(insertDomain.domain)

    console.info(`User: ${userKey} successfully created ${returnDomain.domain} in org: ${org.slug}.`)

    const updatedProperties = []
    if (typeof tags !== 'undefined' && tags.length > 0) {
      updatedProperties.push({
        name: 'tags',
        oldValue: [],
        newValue: tags,
      })
    }

    if (typeof assetState !== 'undefined') {
      updatedProperties.push({
        name: 'assetState',
        oldValue: null,
        newValue: assetState,
      })
    }

    await logActivity({
      transaction,
      collections,
      query,
      initiatedBy: {
        id: user._key,
        userName: user.userName,
        role: permission,
        ipAddress: request.ip,
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

    try {
      await publish({
        channel: 'scans.requests',
        msg: {
          domain: returnDomain.domain,
          domain_key: returnDomain._key,
          hash: returnDomain.hash,
          user_key: null, // only used for One Time Scans
          shared_id: null, // only used for One Time Scans
        },
      })
    } catch (err) {
      console.error(`Error publishing to NATS for domain ${returnDomain._key}: ${err}`)
    }

    try {
      await publish({
        channel: 'scans.add_domain_to_easm',
        msg: {
          domain: returnDomain.domain,
          domain_key: returnDomain._key,
          hash: returnDomain.hash,
          user_key: null, // only used for One Time Scans
          shared_id: null, // only used for One Time Scans
        },
      })
    } catch (err) {
      console.error(`Error publishing to NATS for domain ${returnDomain._key}: ${err}`)
    }

    return {
      ...returnDomain,
      claimTags: tags.map((tag) => {
        return tag[language]
      }),
    }
  },
})
