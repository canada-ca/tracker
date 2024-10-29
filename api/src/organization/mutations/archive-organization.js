import { GraphQLNonNull, GraphQLID } from 'graphql'
import { mutationWithClientMutationId, fromGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

import { removeOrganizationUnion } from '../unions'
import { logActivity } from '../../audit-logs/mutations/log-activity'

export const archiveOrganization = new mutationWithClientMutationId({
  name: 'ArchiveOrganization',
  description: 'This mutation allows the archival of unused organizations.',
  inputFields: () => ({
    orgId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The global id of the organization you wish you archive.',
    },
  }),
  outputFields: () => ({
    result: {
      type: new GraphQLNonNull(removeOrganizationUnion),
      description: '`RemoveOrganizationUnion` returning either an `OrganizationResult`, or `OrganizationError` object.',
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
      auth: { checkPermission, userRequired, verifiedRequired },
      validators: { cleanseInput },
      loaders: { loadOrgByKey },
    },
  ) => {
    // Get user
    const user = await userRequired()

    verifiedRequired({ user })

    // Cleanse Input
    const { type: _orgType, id: orgId } = fromGlobalId(cleanseInput(args.orgId))

    // Get org from db
    const organization = await loadOrgByKey.load(orgId)

    // Check to see if org exists
    if (!organization) {
      console.warn(`User: ${userKey} attempted to archive org: ${orgId}, but there is no org associated with that id.`)
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to archive unknown organization.`),
      }
    }

    // Get users permission
    const permission = await checkPermission({ orgId: organization._id })

    if (permission !== 'super_admin') {
      console.warn(
        `User: ${userKey} attempted to archive org: ${organization._key}, however they do not have the correct permission level. Permission: ${permission}`,
      )
      return {
        _type: 'error',
        code: 403,
        description: i18n._(t`Permission Denied: Please contact super admin for help with archiving organization.`),
      }
    }

    // Setup Trans action
    const trx = await transaction(collections)

    // check to see if any other orgs are using this domain
    let countCursor
    try {
      countCursor = await query`
        WITH claims, domains, organizations
        LET domainIds = (
          FOR v, e IN 1..1 OUTBOUND ${organization._id} claims
            RETURN e._to
        )
        FOR domain IN domains
          FILTER domain._id IN domainIds
          LET count = LENGTH(
            FOR v, e IN 1..1 INBOUND domain._id claims
              RETURN 1
          )
          RETURN {
            _id: domain._id,
            _key: domain._key,
            domain: domain.domain,
            count
          }
      `
    } catch (err) {
      console.error(
        `Database error occurred for user: ${userKey} while attempting to gather domain count while archiving org: ${organization._key}, ${err}`,
      )
      await trx.abort()
      throw new Error(i18n._(t`Unable to archive organization. Please try again.`))
    }

    let domainInfo
    try {
      domainInfo = await countCursor.all()
    } catch (err) {
      console.error(
        `Cursor error occurred for user: ${userKey} while attempting to gather domain count while archiving org: ${organization._key}, ${err}`,
      )
      await trx.abort()
      throw new Error(i18n._(t`Unable to archive organization. Please try again.`))
    }

    for (const domain of domainInfo) {
      if (domain.count === 1) {
        try {
          // Archive domain
          await trx.step(
            async () =>
              await query`
              WITH domains
              UPDATE { _key: ${domain._key}, archived: true } IN domains
          `,
          )
        } catch (err) {
          console.error(
            `Trx step error occurred for user: ${userKey} while attempting to archive domains while archiving org: ${organization._key}, ${err}`,
          )
          await trx.abort()
          throw new Error(i18n._(t`Unable to archive organization. Please try again.`))
        }
      }
    }

    try {
      await trx.step(
        () =>
          query`
            WITH organizations
            UPDATE { _key: ${organization._key}, verified: false } IN organizations
        `,
      )
    } catch (err) {
      console.error(
        `Trx step error occurred for user: ${userKey} while attempting to unverify while archiving org: ${organization._key}, ${err}`,
      )
      await trx.abort()
      throw new Error(i18n._(t`Unable to archive organization. Please try again.`))
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(
        `Trx commit error occurred for user: ${userKey} while attempting archive of org: ${organization._key}, ${err}`,
      )
      await trx.abort()
      throw new Error(i18n._(t`Unable to archive organization. Please try again.`))
    }

    console.info(`User: ${userKey} successfully archived org: ${organization._key}.`)

    await logActivity({
      transaction,
      collections,
      query,
      initiatedBy: {
        id: user._key,
        userName: user.userName,
        role: permission,
      },
      action: 'update',
      updatedProperties: [
        {
          name: 'archived',
          oldValue: false,
          newValue: true,
        },
      ],
      target: {
        resource: {
          en: organization.name,
          fr: organization.name,
        }, // name of resource being acted upon
        resourceType: 'organization', // user, org, domain
      },
    })

    return {
      _type: 'result',
      status: i18n._(t`Successfully archived organization: ${organization.slug}.`),
      organization,
    }
  },
})
