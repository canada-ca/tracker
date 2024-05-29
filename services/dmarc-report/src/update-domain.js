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
    console.warn(`\t${domain} cannot be found in the datastore`)
    return
  }

  console.info(`\tWorking on domain: ${domain}`)

  // get the current owner of the domain
  const orgOwner = await loadOrgOwner({
    arangoCtx,
    domain,
  })

  // if the domain is not owned create ownership
  if (!orgOwner) {
    console.info(`\t\tAssigning ${domain} ownership to: ${String(orgAcronym)}`)
    await createOwnership({ arangoCtx, domain, orgAcronymEn })
  }
  // if the domain is owned by another org, remove ownership and assign a new one
  else if (orgOwner !== orgAcronymEn) {
    console.info(`\t\tRemoving ${domain} ownership from: ${orgOwner}`)
    await removeOwnership({ arangoCtx, domain, orgAcronymEn: orgOwner })

    console.info(`\t\tAssigning ${domain} ownership to: ${String(orgAcronym)}`)
    await createOwnership({ arangoCtx, domain, orgAcronymEn })
  } else {
    console.info(`\t\tOwnership of ${domain} is already assigned to ${String(orgAcronym)}`)
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
      summaryDataToInput = {
        categoryTotals: {
          pass: summaryData.category_totals.pass || 0,
          fail: summaryData.category_totals.fail || 0,
          passDkimOnly: summaryData.category_totals['pass-dkim-only'] || 0,
          passSpfOnly: summaryData.category_totals['pass-spf-only'] || 0,
        },
        detailTables: {
          dkimFailure: summaryData.detail_tables.dkim_failure || [],
          dmarcFailure: summaryData.detail_tables.dmarc_failure || [],
          fullPass: summaryData.detail_tables.full_pass || [],
          spfFailure: summaryData.detail_tables.spf_failure || [],
        },
      }
    }

    const { totalMessages, categoryPercentages } = calculatePercentages({ ...summaryDataToInput.categoryTotals })
    summaryDataToInput.categoryPercentages = categoryPercentages
    summaryDataToInput.totalMessages = totalMessages

    if (arangoDates.indexOf(arangoDate) === -1) {
      console.info(`\t\tInitializing ${arangoDate} for ${domain}`)
      await createSummary({
        arangoCtx,
        domain,
        date: arangoDate,
        summaryData: summaryDataToInput,
      })
    } else if ([currentDate, 'thirtyDays'].includes(arangoDate) || updateAllDates) {
      console.info(`\t\tUpdating ${arangoDate} for ${domain}`)
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
      console.info(`\t\tUpdating domain mail status for ${domain} to ${sendsEmail}`)
      await updateDomainMailStatus({ arangoCtx, domain, sendsEmail })
    }
  }
}

module.exports = {
  updateDomain,
}
