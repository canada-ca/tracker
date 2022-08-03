import { t } from '@lingui/macro'

export const loadMyTrackerByUserId =
  ({ query, userKey, i18n }) =>
  async () => {
    const userDBId = `users/${userKey}`

    let requestedDomainInfo
    try {
      requestedDomainInfo = await query`
        LET favDomainKeys = (
            FOR v, e IN 1..1 OUTBOUND ${userDBId} favourites
                OPTIONS {bfs: true}
                RETURN v._key
        )
        FOR domain IN domains
            FILTER domain._key IN favDomainKeys
            RETURN { 
                id: domain._key, 
                _type: "domain", 
                "phase": domain.phase, 
                "httpsStatus": domain.status.https
            }
        `
    } catch (err) {
      console.error(
        `Database error occurred while user: ${userKey} was trying to query domains in loadDomainsByUser, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to query domain(s). Please try again.`))
    }

    let domainsInfo
    try {
      domainsInfo = await requestedDomainInfo.next()
    } catch (err) {
      console.error(
        `Cursor error occurred while user: ${userKey} was trying to gather domains in loadDomainsByUser, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load domain(s). Please try again.`))
    }

    console.log('domainsInfo:', domainsInfo)

    const returnSummaries = {
      https: {
        pass: 0,
        fail: 0,
        total: 0,
      },
      dmarc_phase: {
        not_implemented: 0,
        assess: 0,
        deploy: 0,
        enforce: 0,
        maintain: 0,
        total: 0,
      },
    }

    domainsInfo.forEach(({ phase, httpsStatus }) => {
      // calculate https summary
      if (httpsStatus === 'pass') {
        returnSummaries.https.pass++
        returnSummaries.https.total++
      } else if (httpsStatus === 'fail') {
        returnSummaries.https.fail++
        returnSummaries.https.total++
      }

      // calculate dmarcPhase summary
      if (phase === 'not implemented')
        returnSummaries.dmarc_phase.not_implemented++
      else if (phase === 'assess') returnSummaries.dmarc_phase.assess++
      else if (phase === 'deploy') returnSummaries.dmarc_phase.deploy++
      else if (phase === 'enforce') returnSummaries.dmarc_phase.enforce++
      else if (phase === 'maintain') returnSummaries.dmarc_phase.maintain++
      returnSummaries.dmarc_phase.total++
    })

    return {
      summaries: returnSummaries,
      domainCount: returnSummaries.dmarc_phase.total,
    }
  }
