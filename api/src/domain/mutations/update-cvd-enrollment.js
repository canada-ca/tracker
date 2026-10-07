import { GraphQLID, GraphQLNonNull } from 'graphql'
import { mutationWithClientMutationId, fromGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

import { updateDomainUnion } from '../unions'
import { cvdEnrollmentFields } from '../../additional-findings/objects/cvd-enrollment'
import ac from '../../access-control'

export const updateCvdEnrollment = new mutationWithClientMutationId({
  name: 'UpdateCvdEnrollment',
  description:
    "Mutation allows the modification of a domain's Coordinated Vulnerability Disclosure (CVD) enrollment details. Requires the organization to have ownership of the domain.",
  inputFields: () => ({
    domainId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The global id of the domain that is being updated.',
    },
    orgId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The global ID of the organization used for permission checks.',
    },
    ...cvdEnrollmentFields,
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
      dataSources: { domain: domainDataSource, organization: orgDS, auditLogs },
    },
  ) => {
    // Get User
    const user = await userRequired()

    verifiedRequired({ user })
    tfaRequired({ user })

    const { id: domainId } = fromGlobalId(cleanseInput(args.domainId))
    const { id: orgId } = fromGlobalId(cleanseInput(args.orgId))

    const cvdEnrollment = {}
    for (const key of Object.keys(cvdEnrollmentFields)) {
      const value = args[key]
      if (value === undefined || value === null) continue
      cvdEnrollment[key] = key === 'description' ? cleanseInput(value) : value
    }

    if (Object.keys(cvdEnrollment).length === 0) {
      console.warn(
        `User: ${userKey} attempted to update cvdEnrollment for domain: ${domainId} with no fields provided.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`No CVD enrollment fields were provided to update.`),
      }
    }

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
    if (!ac.can(permission).updateOwn('cvd-enrollment').granted) {
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

    const hasOwnership = await domainDataSource.organizationHasOwnership({ orgId: org._id, domainId: domain._id })
    if (!hasOwnership) {
      console.warn(
        `User: ${userKey} attempted to update cvdEnrollment for domain: ${domainId} for org: ${orgId}, however that org does not have ownership of that domain.`,
      )
      return {
        _type: 'error',
        code: 403,
        description: i18n._(t`Permission Denied: Please contact organization user for help with updating this domain.`),
      }
    }

    const returnDomain = await domainDataSource.updateCvdEnrollment({ domain, cvdEnrollment })
    console.info(`User: ${userKey} successfully updated cvdEnrollment for domain: ${domainId}.`)

    const previousStatus = domain.cvdEnrollment?.status ?? 'not-enrolled'
    if (typeof cvdEnrollment.status !== 'undefined' && cvdEnrollment.status !== previousStatus) {
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
          updatedProperties: [
            {
              name: 'cvdEnrollment',
              oldValue: previousStatus,
              newValue: cvdEnrollment.status,
            },
          ],
        },
      })
    }

    returnDomain.id = returnDomain._key
    return returnDomain
  },
})
