const { updateDomain } = require('./update-domain')
const { loadCheckOrg } = require('./loaders')
const { updateNoOwnerDomainMailStatus } = require('./database')
const logger = require('./logger')

async function dmarcReport({ ownerships, arangoCtx, currentDate, cosmosDates, container, updateAllDates }) {
  // get org acronyms
  const orgAcronyms = Object.keys(ownerships)

  // loop through orgs
  for (const orgAcronym of orgAcronyms) {
    const orgAcronymEn = orgAcronym.split('-')[0]
    // check if org exists
    const checkOrg = await loadCheckOrg({ arangoCtx, orgAcronymEn })
    if (!checkOrg) {
      logger.warn({ orgAcronym: String(orgAcronym) }, 'Org cannot be found in the datastore, skipping to next org')
      continue
    }

    logger.info({ orgAcronym: String(orgAcronym) }, 'Updating DMARC summary info for org')

    const batchSize = 60

    for (let i = 0; i < ownerships[orgAcronym].length; i += batchSize) {
      // Batch update domains, process 20 at a time
      const domains = ownerships[orgAcronym].slice(i, i + batchSize)

      logger.info({ orgAcronym: String(orgAcronym), batchSize: domains.length }, 'Processing batch of domains for org')

      const queryResults = await container.items
        .query({
          query: `
            SELECT *
            FROM c
            WHERE ARRAY_CONTAINS(@domains, c.domain)
          `,
          parameters: [{ name: '@domains', value: domains }],
        })
        .fetchAll()

      const promises = domains.map((domain) =>
        updateDomain({
          arangoCtx,
          container,
          domain,
          orgAcronym,
          orgAcronymEn,
          queryResults,
          currentDate,
          cosmosDates,
          updateAllDates,
        }),
      )
      await Promise.all(promises)
    }
  }
  // Update send status for all domains without ownership
  await updateNoOwnerDomainMailStatus({ arangoCtx })

  logger.info('Completed updating DMARC summary info for all orgs')
}

module.exports = { dmarcReport }
