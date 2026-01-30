const { updateDomain } = require('./update-domain')
const { removeOwnershipAndSummaries } = require('./database')

async function dmarcReport({ ownerships, arangoCtx, currentDate, cosmosDates, container, updateAllDates }) {
  // get org acronyms
  const orgAcronyms = Object.keys(ownerships)

  let trackerDomains = []
  try {
    trackerDomains = await (
      await arangoCtx.query`
      FOR domain IN domains
        RETURN domain
    `
    ).all()
  } catch (err) {
    console.error(`Error fetching domains from ArangoDB: ${err}`)
    throw new Error('Failed to fetch domains from database')
  }

  const dmarcOwnedDomains = [...new Set(Object.values(ownerships).flat())]

  for (const domain of trackerDomains) {
    if (!dmarcOwnedDomains.includes(domain.domain)) {
      if (domain.dmarcOwnership?.orgAcronym) {
        console.info(
          `Removing ownership and summaries for domain "${domain.domain}" from org "${domain.dmarcOwnership.orgAcronym}"`,
        )
      } else {
        console.info(`Ensuring no ownership or summaries for domain: ${domain.domain}`)
      }
      await removeOwnershipAndSummaries({
        arangoCtx,
        domain,
      })
    }
  }

  // loop through orgs
  for (const orgAcronym of orgAcronyms) {
    console.info(`Updating DMARC summary info for org: ${String(orgAcronym)}`)

    const batchSize = 60

    for (let i = 0; i < ownerships[orgAcronym].length; i += batchSize) {
      // Batch update domains, process 60 at a time
      const domains = ownerships[orgAcronym].slice(i, i + batchSize)

      console.log(`Checking ${domains.length} domains for ${orgAcronym}: ${domains}`)

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
          queryResults,
          currentDate,
          cosmosDates,
          updateAllDates,
        }),
      )
      await Promise.all(promises)
    }
  }
  console.info('Completed assigning ownerships.')
}

module.exports = { dmarcReport }
