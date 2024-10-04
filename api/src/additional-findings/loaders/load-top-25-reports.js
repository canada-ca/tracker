import { t } from '@lingui/macro'

export const loadTop25Reports =
  ({ query, userKey, i18n, language }) =>
  async () => {
    let top25Report

    try {
      top25Report = (
        await query`
         LET verifiedOrgs = (
            FOR org IN organizations
                FILTER org.verified ==  true
                LET orgDetails = TRANSLATE(${language}, org.orgDetails)
                RETURN { id: org._id, orgName: orgDetails.name, orgAcronym: orgDetails.acronym }
        )
        FOR org IN verifiedOrgs
            LET vulnDomainCount = COUNT(
                FOR v, e IN 1..1 OUTBOUND org.id claims
                    OPTIONS { "bfs": true }
                    FILTER v.cveDetected == true
                    RETURN v.domain
            )
            RETURN MERGE({ assetCount: vulnDomainCount }, org)
        `
      ).all()
    } catch (err) {
      console.error(`Database error occurred when user: ${userKey} running loadTop25Reports: ${err}`)
      throw new Error(i18n._(t`Unable to load organization domain statuses. Please try again.`))
    }

    return top25Report
  }
