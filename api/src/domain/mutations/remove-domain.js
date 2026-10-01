import { GraphQLNonNull, GraphQLID } from 'graphql'
import { mutationWithClientMutationId, fromGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

import { removeDomainUnion } from '../unions'
import { DomainRemovalReasonEnum } from '../../enums'
import ac from '../../access-control'

export const removeDomain = new mutationWithClientMutationId({
  name: 'RemoveDomain',
  description: 'This mutation allows the removal of unused domains.',
  inputFields: () => ({
    domainId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The global id of the domain you wish to remove.',
    },
    orgId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The organization you wish to remove the domain from.',
    },
    reason: {
      type: new GraphQLNonNull(DomainRemovalReasonEnum),
      description: 'The reason given for why this domain is being removed from the organization.',
    },
  }),
  outputFields: () => ({
    result: {
      type: new GraphQLNonNull(removeDomainUnion),
      description: '`RemoveDomainUnion` returning either a `DomainResultType`, or `DomainErrorType` object.',
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
      dataSources: { domain: domainDataSource, organization: organizationDS, auditLogs },
    },
  ) => {
    // Get User
    const user = await userRequired()

    verifiedRequired({ user })
    tfaRequired({ user })

    // Cleanse Input
    const { type: _domainType, id: domainId } = fromGlobalId(cleanseInput(args.domainId))
    const { type: _orgType, id: orgId } = fromGlobalId(cleanseInput(args.orgId))

    // Get domain from db
    const domain = await domainDataSource.byKey.load(domainId)

    // Check to see if domain exists
    if (typeof domain === 'undefined') {
      console.warn(`User: ${userKey} attempted to remove ${domainId} however no domain is associated with that id.`)
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to remove unknown domain.`),
      }
    }

    // Get Org from db
    const org = await organizationDS.byKey.load(orgId)

    // Check to see if org exists
    if (typeof org === 'undefined') {
      console.warn(
        `User: ${userKey} attempted to remove ${domain.domain} in org: ${orgId} however there is no organization associated with that id.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to remove domain from unknown organization.`),
      }
    }

    // Get permission
    const permission = await checkPermission({ orgId: org._id })

    if (!ac.can(permission).deleteOwn('domain').granted) {
      console.warn(
        `User: ${userKey} attempted to remove ${domain.domain} in ${org.slug} however they do not have permission in that org.`,
      )
      return {
        _type: 'error',
        code: 403,
        description: i18n._(t`Permission Denied: Please contact organization admin for help with removing domain.`),
      }
    }

    // Check to see if domain belongs to verified check org
    // if domain returns NXDOMAIN, allow removal
    if (org.verified && !ac.can(permission).deleteAny('domain').granted && domain.rcode !== 'NXDOMAIN') {
      console.warn(
        `User: ${userKey} attempted to remove ${domain.domain} in ${org.slug} but does not have permission to remove a domain from a verified check org.`,
      )
      return {
        _type: 'error',
        code: 403,
        description: i18n._(t`Permission Denied: Please contact super admin for help with removing domain.`),
      }
    }

    let orgsClaimingDomain
    let orgsClaimingDomainCount
    try {
      const claims = await domainDataSource.organizationsClaimingDomain({
        domainId: domain._id,
        domainName: domain.domain,
      })
      orgsClaimingDomain = claims.organizations
      orgsClaimingDomainCount = claims.count
    } catch {
      throw new Error(i18n._(t`Unable to remove domain. Please try again.`))
    }
    const orgHasDomainClaim = orgsClaimingDomain.some((orgVertex) => {
      return orgVertex._id === org._id
    })

    if (!orgHasDomainClaim) {
      console.error(
        `Error occurred for user: ${userKey}, when attempting to remove domain "${domain.domain}" from organization with slug "${org.slug}". Organization does not have claim for domain.`,
      )
      throw new Error(i18n._(t`Unable to remove domain. Domain is not part of organization.`))
    }

    let hasOwnership
    try {
      hasOwnership = await domainDataSource.hasOwnershipClaim({
        orgId: org._id,
        domainId: domain._id,
        domainName: domain.domain,
      })
    } catch {
      throw new Error(i18n._(t`Unable to remove domain. Please try again.`))
    }

    try {
      await domainDataSource.remove({
        domain,
        org,
        orgsClaimingDomain: orgsClaimingDomainCount,
        hasOwnership,
      })
    } catch {
      throw new Error(i18n._(t`Unable to remove domain. Please try again.`))
    }

    console.info(`User: ${userKey} successfully removed domain: ${domain.domain} from org: ${org.slug}.`)
    const activityPayload = {
      initiatedBy: {
        id: user._key,
        userName: user.userName,
        role: permission,
        ipAddress: ip,
      },
      action: 'remove',
      target: {
        resource: domain.domain,
        organization: {
          id: org._key,
          name: org.name,
        },
        resourceType: 'domain',
      },
      reason: args.reason,
    }

    await auditLogs.logActivity(activityPayload)

    return {
      _type: 'result',
      status: i18n._(t`Successfully removed domain: ${domain.domain} from ${org.slug}.`),
      domain,
    }
  },
})
