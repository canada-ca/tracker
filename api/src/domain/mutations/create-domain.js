import { GraphQLNonNull, GraphQLList, GraphQLID, GraphQLBoolean, GraphQLString } from 'graphql'
import { mutationWithClientMutationId, fromGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

import { createDomainUnion } from '../unions'
import { Domain } from '../../scalars'
import { AssetStateEnums } from '../../enums'
import { headers } from 'nats'
import { CvdEnrollmentInputOptions } from '../../additional-findings/input/cvd-enrollment-options'
import ac from '../../access-control'

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
      type: new GraphQLList(GraphQLString),
    },
    archived: {
      description: 'Value that determines if the domain is excluded from the scanning process.',
      type: GraphQLBoolean,
    },
    assetState: {
      description: 'Value that determines how the domain relates to the organization.',
      type: new GraphQLNonNull(AssetStateEnums),
    },
    cvdEnrollment: {
      description:
        'The Coordinated Vulnerability Disclosure (CVD) enrollment details for this domain, including HackerOne integration status and CVSS requirements.',
      type: CvdEnrollmentInputOptions,
    },
    highAvailability: {
      description: 'Value that determines if the service is scanned for uptime.',
      type: GraphQLBoolean,
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
      userKey,
      publish,
      auth: { checkPermission, saltedHash, userRequired, tfaRequired, verifiedRequired },
      dataSources: { domain: domainDS, tags: tagsDS, organization: orgDS, auditLogs },
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
      tags = await tagsDS.byTagId.loadMany(
        args.tags.map((tag) => {
          return cleanseInput(tag)
        }),
      )
      tags = tags
        .filter(({ visible, ownership, organizations }) => {
          // Filter out tags that are not visible or do not belong to the org
          return visible && (ownership === 'global' || organizations.some((org) => org._id === orgId))
        })
        .map((tag) => tag.tagId)
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
      assetState = 'approved'
    }

    const cvdEnrollment = args.cvdEnrollment || { status: 'not-enrolled' }
    const highAvailability = args.highAvailability || false

    // Check to see if org exists
    const org = await orgDS.byKey.load(orgId)

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

    if (!ac.can(permission).createOwn('domain').granted) {
      console.warn(
        `User: ${userKey} attempted to create a domain in: ${org.slug}, however they do not have permission to do so.`,
      )
      return {
        _type: 'error',
        code: 403,
        description: i18n._(t`Permission Denied: Please contact organization user for help with creating domain.`),
      }
    }

    // ensure only owners can enroll or deny domains
    if (
      !ac.can(permission).createOwn('cvd-enrollment').granted &&
      ['enrolled', 'deny'].includes(cvdEnrollment.status)
    ) {
      console.warn(
        `User: ${userKey} attempted to update the CVD enrollment for domain: ${domain} in org: ${orgId}, however they do not have permission in that org.`,
      )
      cvdEnrollment.status = cvdEnrollment.status === 'enrolled' ? 'pending' : 'not-enrolled'
    }

    if (!ac.can(permission).createAny('domain').granted && highAvailability === true) {
      console.warn(
        `User: ${userKey} attempted to create a high availability domain in: ${org.slug}, however they do not have permission to do so.`,
      )
      return {
        _type: 'error',
        code: 403,
        description: i18n._(t`Permission Denied: Please contact super admin for help with creating domain.`),
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
      archived,
      ignoreRua: false,
      cvdEnrollment,
      highAvailability,
    }

    const orgAlreadyClaimsDomain = await domainDS.organizationAlreadyClaimsDomainName({
      orgId: org._id,
      domainName: insertDomain.domain,
    })

    if (orgAlreadyClaimsDomain) {
      console.warn(
        `User: ${userKey} attempted to create a domain for: ${org.slug}, however that org already has that domain claimed.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to create domain, organization has already claimed it.`),
      }
    }

    const returnDomain = await domainDS.create({ insertDomain, org, tags, assetState })

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

    if (typeof cvdEnrollment !== 'undefined') {
      updatedProperties.push({
        name: 'cvdEnrollment',
        oldValue: null,
        newValue: cvdEnrollment.enrollment,
      })
    }

    await auditLogs.logActivity({
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
        },
        resourceType: 'domain',
      },
    })

    const hdrs = headers()
    hdrs.set('priority', 'high')

    try {
      await publish({
        channel: 'scans.requests_priority',
        msg: {
          domain: returnDomain.domain,
          domain_key: returnDomain._key,
          hash: returnDomain.hash,
          user_key: null, // only used for One Time Scans
          shared_id: null, // only used for One Time Scans
        },
        options: {
          headers: hdrs,
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
      claimTags: tags,
    }
  },
})
