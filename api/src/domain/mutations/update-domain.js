import { GraphQLID, GraphQLNonNull, GraphQLList, GraphQLBoolean, GraphQLString } from 'graphql'
import { mutationWithClientMutationId, fromGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

import { updateDomainUnion } from '../unions'
import { AssetStateEnums } from '../../enums'
import { CvdEnrollmentInputOptions } from '../../additional-findings/input/cvd-enrollment-options'
import ac from '../../access-control'

export const updateDomain = new mutationWithClientMutationId({
  name: 'UpdateDomain',
  description: 'Mutation allows the modification of domains if domain is updated through out its life-cycle',
  inputFields: () => ({
    domainId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The global id of the domain that is being updated.',
    },
    orgId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The global ID of the organization used for permission checks.',
    },
    tags: {
      description: 'List of labelled tags users have applied to the domain.',
      type: new GraphQLList(GraphQLString),
    },
    archived: {
      description: 'Value that determines if the domain is excluded from the scanning process.',
      type: GraphQLBoolean,
    },
    ignoreRua: {
      description: 'Boolean value that determines if the domain should ignore rua reports.',
      type: GraphQLBoolean,
    },
    assetState: {
      description: 'Value that determines how the domain relates to the organization.',
      type: AssetStateEnums,
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
      type: updateDomainUnion,
      description: '`UpdateDomainUnion` returning either a `Domain`, or `DomainError` object.',
      resolve: (payload) => payload,
    },
  }),
  mutateAndGetPayload: async (
    args,
    {
      i18n,
      userKey,
      request: { ip },
      auth: { checkPermission, userRequired, verifiedRequired, tfaRequired },
      validators: { cleanseInput },
      dataSources: { domain: domainDataSource, auditLogs, tags: tagsDS, organization: orgDS },
    },
  ) => {
    // Get User
    const user = await userRequired()

    verifiedRequired({ user })
    tfaRequired({ user })

    const { id: domainId } = fromGlobalId(cleanseInput(args.domainId))
    const { id: orgId } = fromGlobalId(cleanseInput(args.orgId))

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
          return visible && (ownership === 'global' || organizations.some((org) => org === orgId))
        })
        .map((tag) => tag.tagId)
    } else {
      tags = null
    }

    const archived = typeof args.archived !== 'undefined' ? args.archived : null
    const assetState = typeof args.assetState !== 'undefined' ? cleanseInput(args.assetState) : null
    const cvdEnrollment = typeof args.cvdEnrollment !== 'undefined' ? args.cvdEnrollment : null

    // Check to see if domain exists
    const domain = await domainDataSource.byKey.load(domainId)

    if (typeof domain === 'undefined') {
      console.warn(
        `User: ${userKey} attempted to update domain: ${domainId}, however there is no domain associated with that id.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to update unknown domain.`),
      }
    }

    // Check to see if org exists
    const org = await orgDS.byKey.load(orgId)

    if (typeof org === 'undefined') {
      console.warn(
        `User: ${userKey} attempted to update domain: ${domainId} for org: ${orgId}, however there is no org associated with that id.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to update domain in an unknown org.`),
      }
    }

    // Check permission
    const permission = await checkPermission({ orgId: org._id })

    if (!ac.can(permission).updateOwn('domain').granted) {
      console.warn(
        `User: ${userKey} attempted to update domain: ${domainId} for org: ${orgId}, however they do not have permission in that org.`,
      )
      return {
        _type: 'error',
        code: 403,
        description: i18n._(t`Permission Denied: Please contact organization user for help with updating this domain.`),
      }
    }

    // Check to see if org has a claim to this domain
    let orgHasClaim
    try {
      orgHasClaim = await domainDataSource.organizationHasClaim({
        orgId: org._id,
        domainId: domain._id,
        domainKey: domainId,
      })
    } catch {
      throw new Error(i18n._(t`Unable to update domain. Please try again.`))
    }

    if (!orgHasClaim) {
      console.warn(
        `User: ${userKey} attempted to update domain: ${domainId} for org: ${orgId}, however that org has no claims to that domain.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to update domain that does not belong to the given organization.`),
      }
    }

    if (
      !ac.can(permission).updateOwn('cvd-enrollment').granted &&
      ['enrolled', 'deny'].includes(cvdEnrollment?.status)
    ) {
      console.warn(
        `User: ${userKey} attempted to update the CVD enrollment for domain: ${domainId} in org: ${orgId}, however they do not have permission in that org.`,
      )
      cvdEnrollment.status = cvdEnrollment.status === 'enrolled' ? 'pending' : 'not-enrolled'
    }

    if (!ac.can(permission).updateAny('domain').granted && typeof args.highAvailability !== 'undefined') {
      console.warn(
        `User: ${userKey} attempted to update a high availability domain in: ${org.slug}, however they do not have permission to do so.`,
      )
      return {
        _type: 'error',
        code: 403,
        description: i18n._(t`Permission Denied: Please contact super admin for help with updating domain.`),
      }
    }

    const claim = await domainDataSource.loadClaimByOrgAndDomain({
      orgId: org._id,
      domainId: domain._id,
    })

    const domainToInsert = {
      archived: typeof archived !== 'undefined' ? archived : domain?.archived,
      ignoreRua: typeof args.ignoreRua !== 'undefined' ? args.ignoreRua : domain?.ignoreRua,
      cvdEnrollment: typeof cvdEnrollment !== 'undefined' ? cvdEnrollment : domain?.cvdEnrollment,
      highAvailability: typeof args.highAvailability !== 'undefined' ? args.highAvailability : domain?.highAvailability,
    }

    const claimToInsert = {
      tags: tags || claim?.tags,
      firstSeen: typeof claim?.firstSeen === 'undefined' ? new Date().toISOString() : claim?.firstSeen,
      assetState: assetState || claim?.assetState,
    }

    let returnDomain
    try {
      const domainForUpdate = typeof domain?._key === 'undefined' ? { ...domain, _key: domainId } : domain
      returnDomain = await domainDataSource.update({ domain: domainForUpdate, org, domainToInsert, claimToInsert })
    } catch {
      throw new Error(i18n._(t`Unable to update domain. Please try again.`))
    }

    console.info(`User: ${userKey} successfully updated domain: ${domainId}.`)

    const updatedProperties = []
    if (typeof assetState !== 'undefined' && assetState !== claim.assetState) {
      updatedProperties.push({
        name: 'assetState',
        oldValue: claim.assetState,
        newValue: assetState,
      })
    }

    if (typeof cvdEnrollment !== 'undefined' && cvdEnrollment?.status !== domain?.cvdEnrollment?.status) {
      updatedProperties.push({
        name: 'cvdEnrollment',
        oldValue: JSON.stringify(domain.cvdEnrollment?.status),
        newValue: JSON.stringify(cvdEnrollment.status),
      })
    }

    if (JSON.stringify(claim.tags) !== JSON.stringify(claimToInsert.tags)) {
      updatedProperties.push({
        name: 'tags',
        oldValue: claim.tags,
        newValue: claimToInsert.tags,
      })
    }

    if (updatedProperties.length > 0) {
      await auditLogs.logActivity({
        initiatedBy: {
          id: user._key,
          userName: user.userName,
          role: permission,
          ipAddress: ip,
        },
        action: 'update',
        target: {
          resource: domain.domain,
          organization: {
            id: org._key,
            name: org.name,
          },
          resourceType: 'domain',
          updatedProperties,
        },
      })
    }

    if (typeof archived !== 'undefined') {
      await auditLogs.logActivity({
        initiatedBy: {
          id: user._key,
          userName: user.userName,
          role: permission,
          ipAddress: ip,
        },
        action: 'update',
        target: {
          resource: domain.domain,
          resourceType: 'domain',
          updatedProperties: [{ name: 'archived', oldValue: domain.archived, newValue: archived }],
        },
      })
    }

    returnDomain.id = returnDomain._key

    return {
      ...returnDomain,
      claimTags: claimToInsert.tags,
      assetState,
    }
  },
})
