import { t } from '@lingui/macro'

export const loadMyTrackerByUserId =
  ({ query, userKey, i18n }) =>
  async () => {
    const userDBId = `users/${userKey}`

    let requestedDomainInfo
    try {
      requestedDomainInfo = await query`
        WITH users, domains
        LET favDomains = (
            FOR v, e IN 1..1 OUTBOUND ${userDBId} favourites
                OPTIONS {order: "bfs"}
                RETURN { "id": v._key, "phase": v.phase, "https": v.status.https, "dmarc": v.status.dmarc, "_type": "domain" }
        )
        RETURN { "domains": favDomains }
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

    const returnSummaries = {
      https: {
        pass: 0,
        fail: 0,
        total: 0,
      },
      dmarc: {
        pass: 0,
        fail: 0,
        total: 0,
      },
      dmarc_phase: {
        assess: 0,
        deploy: 0,
        enforce: 0,
        maintain: 0,
        total: 0,
      },
    }

    domainsInfo.domains.forEach(({ phase, https, dmarc }) => {
      // calculate https summary
      if (https === 'pass') {
        returnSummaries.https.pass++
        returnSummaries.https.total++
      } else if (https === 'fail') {
        returnSummaries.https.fail++
        returnSummaries.https.total++
      }

      // calculate DMARC summary
      if (dmarc === 'pass') returnSummaries.dmarc.pass++
      else if (dmarc === 'fail') returnSummaries.dmarc.fail++
      returnSummaries.dmarc.total++

      // calculate dmarcPhase summary
      if (phase === 'assess') returnSummaries.dmarc_phase.assess++
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
