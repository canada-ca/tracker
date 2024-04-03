import { t } from '@lingui/macro'

export const loadAllOrganizationDomainStatuses =
  ({ query, userKey, i18n }) =>
  async ({ blocked }) => {
    let statuses

    try {
      if (blocked) {
        statuses = (
          await query`
          WITH domains, organizations
          FOR org IN organizations
              FILTER org.orgDetails.en.acronym != "SA"
              FOR domain, claim IN 1..1 OUTBOUND org._id claims
                  FILTER domain.blocked == true
                  RETURN {
                      "Organization name (English)": org.orgDetails.en.name,
                      "Nom de l'organisation (Français)": org.orgDetails.fr.name,
                      "Domain": domain.domain,
                      "HTTPS": domain.status.https,
                      "HSTS": domain.status.hsts,
                      "Ciphers": domain.status.ciphers,
                      "Curves": domain.status.curves,
                      "Protocols": domain.status.protocols,
                      "SPF": domain.status.spf,
                      "DKIM": domain.status.dkim,
                      "DMARC": domain.status.dmarc
                  }
      `
        ).all()
      } else {
        statuses = (
          await query`
          WITH domains, organizations
          FOR org IN organizations
              FILTER org.orgDetails.en.acronym != "SA"
              FOR domain, claim IN 1..1 OUTBOUND org._id claims
                  RETURN {
                      "Organization name (English)": org.orgDetails.en.name,
                      "Nom de l'organisation (Français)": org.orgDetails.fr.name,
                      "Domain": domain.domain,
                      "HTTPS": domain.status.https,
                      "HSTS": domain.status.hsts,
                      "Ciphers": domain.status.ciphers,
                      "Curves": domain.status.curves,
                      "Protocols": domain.status.protocols,
                      "SPF": domain.status.spf,
                      "DKIM": domain.status.dkim,
                      "DMARC": domain.status.dmarc
                  }
      `
        ).all()
      }
    } catch (err) {
      console.error(`Database error occurred when user: ${userKey} running loadAllOrganizationDomainStatuses: ${err}`)
      throw new Error(i18n._(t`Unable to load all organization domain statuses. Please try again.`))
    }

    return statuses
  }
