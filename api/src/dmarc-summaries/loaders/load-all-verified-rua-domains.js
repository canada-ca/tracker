import { t } from '@lingui/macro'

export const loadAllVerifiedRuaDomains =
  ({ query, userKey, i18n }) =>
  async () => {
    let verifiedRuaDomains
    try {
      verifiedRuaDomains = (
        await query`
            FOR org IN organizations
              FILTER org.verified == true
              SORT org.orgDetails.en.acronym ASC
              LET domains = (
                  FOR domain,claim IN 1..1 OUTBOUND org claims
                      FILTER domain.archived != true
                      FILTER domain.ignoreRua != true
                      FILTER domain.rcode != "NXDOMAIN"
                      FILTER domain.hasCyberRua == true
                      SORT domain.domain ASC
                      RETURN domain.domain
              )
              RETURN { key: CONCAT(org.orgDetails.en.acronym, "-", org.orgDetails.fr.acronym), domains }
        `
      ).all()
    } catch (err) {
      console.error(`Database error occurred when user: ${userKey} was trying to load verified rua domains: ${err}`)
      throw new Error(i18n._(t`Unable to load verified rua domains. Please try again.`))
    }

    return verifiedRuaDomains
  }
