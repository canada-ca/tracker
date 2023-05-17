import { t } from '@lingui/macro'
import { logActivity } from '../../audit-logs/mutations/log-activity'

export const loadOrganizationDomainStatuses =
  ({ query, collections, transaction, userKey, i18n, auth: { userRequired, verifiedRequired } }) =>
  async ({ orgId }) => {
    const user = await userRequired()
    verifiedRequired({ user })

    let domains
    try {
      domains = (
        await query`
        WITH claims, domains, organizations
        FOR v, e IN 1..1 OUTBOUND ${orgId} claims
          RETURN {
            domain: v.domain,
            status: v.status
          }
      `
      ).all()
    } catch (err) {
      console.error(`Database error occurred when user: ${userKey} running loadOrganizationDomainStatuses: ${err}`)
      throw new Error(i18n._(t`Unable to load organization domain statuses. Please try again.`))
    }

    // Get org names to use in email
    let orgCursor
    try {
      orgCursor = await query`RETURN DOCUMENT(organizations, ${orgId})`
    } catch (err) {
      console.error(`Database error occurred when user: ${userKey} running loadOrganizationDomainStatuses: ${err}`)
      throw new Error(i18n._(t`Unable to load organization domain statuses. Please try again.`))
    }

    let org
    try {
      org = await orgCursor.next()
    } catch (err) {
      console.error(`Cursor error occurred when user: ${userKey} running loadOrganizationDomainStatuses: ${err}`)
      throw new Error(i18n._(t`Unable to load organization domain statuses. Please try again.`))
    }

    await logActivity({
      transaction,
      collections,
      query,
      initiatedBy: {
        id: user._key,
        userName: user.userName,
      },
      action: 'export',
      target: {
        resource: {
          en: org.orgDetails.en.name,
          fr: org.orgDetails.fr.name,
        },
        organization: {
          id: org._key,
          name: org.orgDetails.en.name,
        },
        resourceType: 'organization', // user, org, domain
      },
    })

    return domains
  }
