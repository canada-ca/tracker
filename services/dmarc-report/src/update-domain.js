const { loadCheckDomain, loadOrgOwner, loadArangoDates } = require('./loaders')
const {
  createOwnership,
  removeOwnership,
  removeSummary,
  createSummary,
  upsertSummary,
  updateDomainMailStatus,
} = require('./database')
const { calculatePercentages } = require('./utils')
const logger = require('./logger')

async function updateDomain({
  arangoCtx,
  domain,
  orgAcronym,
  orgAcronymEn,
  queryResults,
  currentDate,
  cosmosDates,
  updateAllDates,
}) {
  // check to see if domain exists
  const checkDomain = await loadCheckDomain({ arangoCtx, domain })
  if (!checkDomain) {
    logger.warn({ domain }, 'Domain cannot be found in the datastore')
    return
  }

  logger.info({ domain }, 'Working on domain')

  // get the current owner of the domain
  const orgOwner = await loadOrgOwner({
    arangoCtx,
    domain,
  })

  // if the domain is not owned create ownership
  if (!orgOwner) {
    logger.info({ domain, orgAcronym: String(orgAcronym) }, 'Assigning domain ownership')
    await createOwnership({ arangoCtx, domain, orgAcronymEn })
  }
  // if the domain is owned by another org, remove ownership and assign a new one
  else if (orgOwner !== orgAcronymEn) {
    logger.info({ domain, orgOwner }, 'Removing domain ownership from current owner')
    await removeOwnership({ arangoCtx, domain, orgAcronymEn: orgOwner })

    logger.info({ domain, orgAcronym: String(orgAcronym) }, 'Assigning domain ownership to new owner')
    await createOwnership({ arangoCtx, domain, orgAcronymEn })
  } else {
    logger.info({ domain, orgAcronym: String(orgAcronym) }, 'Domain ownership is already correct, no changes needed')
  }

  const arangoDates = await loadArangoDates({ arangoCtx, domain })
  for (const date of arangoDates) {
    if (date === 'thirtyDays') continue // Do not remove thirtyDays summary
    if (cosmosDates.indexOf(date) === -1) {
      // remove periods in arango
      logger.info({ domain, date }, 'Removing out of date summary')
      await removeSummary({
        arangoCtx,
        domain,
        date,
      })
    }
  }

  const domainData = queryResults.resources.filter((resource) => resource.domain === domain)
  if (!domainData.length > 0) {
    logger.warn({ domain }, 'Domain cannot be found in the summaries container')
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

    if (arangoDates.indexOf(arangoDate) === -1) {
      logger.info({ domain, date: arangoDate }, 'Creating new summary for date')
      await createSummary({
        arangoCtx,
        domain,
        date: arangoDate,
        summaryData: summaryDataToInput,
      })
    } else if ([currentDate, 'thirtyDays'].includes(arangoDate) || updateAllDates) {
      logger.info({ domain, date: arangoDate }, 'Updating existing summary for date')

      await upsertSummary({
        arangoCtx,
        domain,
        date: arangoDate,
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
      logger.info({ domain, sendsEmail }, 'Updating domain mail status')
      await updateDomainMailStatus({ arangoCtx, domain, sendsEmail })
    }
  }
}

module.exports = {
  updateDomain,
}
