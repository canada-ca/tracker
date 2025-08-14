const { loadCheckDomain, loadArangoDates } = require('./loaders')
const { removeSummary, createSummary, upsertSummary, updateDomainMailStatus } = require('./database')
const { calculatePercentages } = require('./utils')

async function updateDomain({ arangoCtx, domain, orgAcronym, queryResults, currentDate, cosmosDates, updateAllDates }) {
  // check to see if domain exists
  const checkDomain = await loadCheckDomain({ arangoCtx, domain })
  if (!checkDomain) {
    console.warn(`\t${domain} cannot be found in the datastore`)
    return
  }

  console.info(`\tWorking on domain: ${domain}`)

  const dmarcOwner = checkDomain.dmarcOwnership?.orgAcronym

  // if the domain is not owned create ownership
  if (!dmarcOwner) {
    console.info(`\t\tUnowned domain. Assigning ${domain} ownership to: ${String(orgAcronym)}`)
  }
  // if the domain is owned by another org, remove ownership and assign a new one
  else if (dmarcOwner !== orgAcronym) {
    console.info(`\t\tChanging ownership of ${domain} from ${String(dmarcOwner)} to ${String(orgAcronym)}`)
  }

  const arangoDates = await loadArangoDates({ arangoCtx, domain })
  for (const date of arangoDates) {
    if (date === 'thirtyDays') continue // Do not remove thirtyDays summary
    if (cosmosDates.indexOf(date) === -1) {
      // remove periods in arango
      console.info(`\t\tRemoving ${date} for ${domain}`)
      await removeSummary({
        arangoCtx,
        domain,
        date,
      })
    }
  }

  const domainData = queryResults.resources.filter((resource) => resource.domain === domain)
  if (!domainData.length > 0) {
    console.warn(`\t\t${domain} cannot be found in the summaries container`)
  }

  for (const date of cosmosDates) {
    const arangoDate = date === 'thirty_days' ? 'thirtyDays' : date
    const summaryData = domainData.find((resource) => resource.id === date)
    let summaryDataToInput
    if (!summaryData) {
      summaryDataToInput = {
        categoryTotals: {
          pass: 0,
          fail: 0,
          passDkimOnly: 0,
          passSpfOnly: 0,
        },
        detailTables: {
          dkimFailure: [],
          dmarcFailure: [],
          fullPass: [],
          spfFailure: [],
        },
      }
    } else {
      const dkimFailureTable = summaryData.detail_tables.dkim_failure || []
      const dkimFailureTableFormatted = dkimFailureTable.map((row) => {
        return {
          sourceIpAddress: row.source_ip_address,
          envelopeFrom: row.envelope_from,
          headerFrom: row.header_from,
          dkimDomains: row.dkim_domains,
          dkimSelectors: row.dkim_selectors,
          dkimResults: row.dkim_results,
          dkimAligned: row.dkim_aligned,
          totalMessages: row.total_messages,
          dnsHost: row.dns_host,
          id: row.cursor,
          guidance: row.guidance,
        }
      })
      const dmarcFailureTable = summaryData.detail_tables.dmarc_failure || []
      const dmarcFailureTableFormatted = dmarcFailureTable.map((row) => {
        return {
          sourceIpAddress: row.source_ip_address,
          envelopeFrom: row.envelope_from,
          headerFrom: row.header_from,
          spfDomains: row.spf_domains,
          dkimDomains: row.dkim_domains,
          dkimSelectors: row.dkim_selectors,
          disposition: row.disposition,
          totalMessages: row.total_messages,
          dnsHost: row.dns_host,
          id: row.cursor,
        }
      })
      const fullPassTable = summaryData.detail_tables.full_pass || []
      const fullPassTableFormatted = fullPassTable.map((row) => {
        return {
          sourceIpAddress: row.source_ip_address,
          envelopeFrom: row.envelope_from,
          headerFrom: row.header_from,
          spfDomains: row.spf_domains,
          dkimDomains: row.dkim_domains,
          dkimSelectors: row.dkim_selectors,
          totalMessages: row.total_messages,
          dnsHost: row.dns_host,
          id: row.cursor,
        }
      })
      const spfFailureTable = summaryData.detail_tables.spf_failure || []
      const spfFailureTableFormatted = spfFailureTable.map((row) => {
        return {
          sourceIpAddress: row.source_ip_address,
          envelopeFrom: row.envelope_from,
          headerFrom: row.header_from,
          spfDomains: row.spf_domains,
          spfResults: row.spf_results,
          spfAligned: row.spf_aligned,
          totalMessages: row.total_messages,
          id: row.cursor,
          dnsHost: row.dns_host,
          guidance: row.guidance,
        }
      })
      summaryDataToInput = {
        categoryTotals: {
          pass: summaryData.category_totals.pass || 0,
          fail: summaryData.category_totals.fail || 0,
          passDkimOnly: summaryData.category_totals['pass-dkim-only'] || 0,
          passSpfOnly: summaryData.category_totals['pass-spf-only'] || 0,
        },
        detailTables: {
          dkimFailure: dkimFailureTableFormatted,
          dmarcFailure: dmarcFailureTableFormatted,
          fullPass: fullPassTableFormatted,
          spfFailure: spfFailureTableFormatted,
        },
      }
    }

    const { totalMessages, categoryPercentages } = calculatePercentages({ ...summaryDataToInput.categoryTotals })
    summaryDataToInput.categoryPercentages = categoryPercentages
    summaryDataToInput.totalMessages = totalMessages

    const sourceLastUpdated = summaryData?._ts * 1000 || null // _ts stored as seconds, need ms

    if (arangoDates.indexOf(arangoDate) === -1) {
      console.info(`\t\tInitializing ${arangoDate} for ${domain}`)
      await createSummary({
        arangoCtx,
        domain,
        date: arangoDate,
        sourceLastUpdated,
        summaryData: summaryDataToInput,
      })
    } else if ([currentDate, 'thirtyDays'].includes(arangoDate) || updateAllDates) {
      console.info(`\t\tUpdating ${arangoDate} for ${domain}`)
      await upsertSummary({
        arangoCtx,
        domain,
        date: arangoDate,
        sourceLastUpdated,
        summaryData: summaryDataToInput,
      })
    }

    if (date === 'thirty_days') {
      // update domain mail status
      let sendsEmail = 'false'
      if (
        [
          summaryDataToInput.categoryTotals.pass,
          summaryDataToInput.categoryTotals.passDkimOnly,
          summaryDataToInput.categoryTotals.passSpfOnly,
        ].some((total) => total > 0)
      ) {
        sendsEmail = 'true'
      }
      console.info(`\t\tUpdating domain mail status for ${domain} to ${sendsEmail}`)
      await updateDomainMailStatus({ arangoCtx, domain, sendsEmail })
    }
  }
}

module.exports = {
  updateDomain,
}
