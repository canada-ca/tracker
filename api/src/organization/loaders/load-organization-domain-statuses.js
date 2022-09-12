import { t } from '@lingui/macro'

export const loadOrganizationDomainStatuses = ({ query, userKey, i18n }) =>
  async ({orgId}) => {
    let domains

    try {
      domains = (await query`
        WITH claims, domains, organizations
        FOR v, e IN 1..1 OUTBOUND ${orgId} claims
          RETURN {
            domain: v.domain,
            status: v.status
          }
      `).all()
    } catch (err) {
      console.error(
        `Database error occurred when user: ${userKey} running loadOrganizationDomainStatuses: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to load organization domain statuses. Please try again.`),
      )
    }

    return domains
  }
