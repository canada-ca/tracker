const { calculatePercentages } = require('./utils')

module.exports.dmarcReport = async ({
  ownerships,
  createOwnership,
  removeOwnership,
  removeSummary,
  loadArangoDates,
  loadCheckOrg,
  loadCheckDomain,
  loadOrgOwner,
  updateDomainMailStatus,
  updateNoOwnerDomainMailStatus,
  createSummary,
  upsertSummary,
  cosmosDates,
  currentDate,
  container,
  UPDATE_ALL_DATES,
}) => {
  // get org acronyms
  const orgAcronyms = Object.keys(ownerships)

  async function updateDomainFunc(domain, orgAcronym, orgAcronymEn, queryResults) {
    // check to see if domain exists
    const checkDomain = await loadCheckDomain({ domain })
    if (!checkDomain) {
      console.warn(`\t${domain} cannot be found in the datastore`)
      return
    }

    console.info(`\tWorking on domain: ${domain}`)

    // get the current owner of the domain
    const orgOwner = await loadOrgOwner({
      domain,
    })

    // if the domain is not owned create ownership
    if (!orgOwner) {
      console.info(`\t\tAssigning ${domain} ownership to: ${String(orgAcronym)}`)
      await createOwnership({ domain, orgAcronymEn })
    }
    // if the domain is owned by another org, remove ownership and assign a new one
    else if (orgOwner !== orgAcronymEn) {
      console.info(`\t\tRemoving ${domain} ownership from: ${orgOwner}`)
      await removeOwnership({ domain, orgAcronymEn })

      console.info(`\t\tAssigning ${domain} ownership to: ${String(orgAcronym)}`)
      await createOwnership({ domain, orgAcronymEn })
    } else {
      console.info(`\t\tOwnership of ${domain} is already assigned to ${String(orgAcronym)}`)
    }

    const arangoDates = await loadArangoDates({ domain })
    for (const date of arangoDates) {
      if (cosmosDates.indexOf(date) === -1) {
        // remove periods in arango
        console.info(`\t\tRemoving ${date} for ${domain}`)
        await removeSummary({
          domain,
          date,
        })
      }
    }

    const domainData = queryResults.resources.filter((resource) => resource.domain === domain)
    if (!domainData.length > 0) {
      console.warn(`\t${domain} cannot be found in the summaries container`)
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

      if (arangoDates.indexOf(date) === -1) {
        console.info(`\t\tCreating ${date} for ${domain}`)
        await createSummary({
          domain,
          date: arangoDate,
          summaryData: summaryDataToInput,
        })
      } else if (date === currentDate || UPDATE_ALL_DATES) {
        console.info(`\t\tUpserting ${date} for ${domain}`)
        await upsertSummary({
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
        await updateDomainMailStatus({ domain, sendsEmail })
      }
    }
  }

  // loop through orgs
  for (const orgAcronym of orgAcronyms) {
    const orgAcronymEn = orgAcronym.split('-')[0]
    // check if org exists
    const checkOrg = await loadCheckOrg({ orgAcronymEn })
    if (!checkOrg) {
      console.warn(`Org: ${orgAcronym} cannot be found in datastore`)
      continue
    }

    console.info(`Updating DMARC summary info for org: ${String(orgAcronym)}`)

    const batchSize = 60

    for (let i = 0; i < ownerships[orgAcronym].length; i += batchSize) {
      // Batch update domains, process 20 at a time
      const domains = ownerships[orgAcronym].slice(i, i + batchSize)

      console.log(`Checking ${domains.length} domains for ${orgAcronym}: ${domains}`)

      const queryResults = await container.items
        .query({
          query: `
          SELECT
            *
          FROM c
          WHERE ARRAY_CONTAINS(@domains, c.domain)
        `,
          parameters: [{ name: '@domains', value: domains }],
        })
        .fetchAll()

      const promises = domains.map((domain) => updateDomainFunc(domain, orgAcronym, orgAcronymEn, queryResults))
      await Promise.all(promises)
    }
  }
  // Update send status for all domains without ownership
  await updateNoOwnerDomainMailStatus()

  console.info('Completed assigning ownerships.')
}
