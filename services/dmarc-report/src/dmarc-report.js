const { updateDomain } = require('./update-domain')

module.exports.dmarcReport = async ({
  ownerships,
  createOwnership,
  removeOwnership,
  removeSummary,
  loadArangoDates,
  loadArangoThirtyDaysCount,
  loadCheckOrg,
  loadCheckDomain,
  loadOrgOwner,
  createSummary,
  upsertSummary,
  cosmosDates,
  currentDate,
}) => {
  // get org acronyms
  const orgAcronyms = Object.keys(ownerships)

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

    const batchSize = 20

    for (let i = 0; i < ownerships[orgAcronym].length; i += batchSize) {
      // Batch update domains, process 20 at a time
      const domains = ownerships[orgAcronym].slice(i, i + batchSize)

      await Promise.all(
        domains.map(async (domain) => {
          await updateDomain(
            loadCheckDomain,
            domain,
            loadOrgOwner,
            orgAcronym,
            createOwnership,
            orgAcronymEn,
            removeOwnership,
            loadArangoDates,
            cosmosDates,
            removeSummary,
            createSummary,
            currentDate,
            upsertSummary,
            loadArangoThirtyDaysCount,
          )
        }),
      )
    }
  }

  console.info('Completed assigning ownerships.')
}
