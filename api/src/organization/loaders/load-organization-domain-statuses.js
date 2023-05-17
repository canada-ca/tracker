import { t } from '@lingui/macro'
import { logActivity } from '../../audit-logs/mutations/log-activity'

export const loadOrganizationDomainStatuses =
  ({
    query,
    collections,
    transaction,
    userKey,
    i18n,
    auth: { userRequired, verifiedRequired },
    loaders: { loadOrgByKey },
  }) =>
  async ({ orgKey }) => {
    const user = await userRequired()
    verifiedRequired({ user })

    const org = await loadOrgByKey.load(orgKey)
    const orgId = org._id

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
    let orgNamesCursor
    try {
      orgNamesCursor = await query`
        LET org = DOCUMENT(organizations, ${org._id})
        RETURN {
          "orgNameEN": org.orgDetails.en.name,
          "orgNameFR": org.orgDetails.fr.name,
        }
      `
    } catch (err) {
      console.error(
        `Database error occurred when user: ${userKey} attempted to export org: ${orgKey}. Error while creating cursor for retrieving organization names. error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load organization domain statuses. Please try again.`))
    }

    let orgNames
    try {
      orgNames = await orgNamesCursor.next()
    } catch (err) {
      console.error(
        `Cursor error occurred when user: ${userKey} attempted to export org: ${orgKey}. Error while retrieving organization names. error: ${err}`,
      )
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
          en: orgNames.orgNameEN,
          fr: orgNames.orgNameFR,
        },
        resourceType: 'organization', // user, org, domain
      },
    })

    return domains
  }
