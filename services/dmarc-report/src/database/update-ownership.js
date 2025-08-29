async function updateOwnership({ arangoCtx, domain, orgAcronym }) {
  const collectionStrings = Object.keys(arangoCtx.collections)
  const trx = await arangoCtx.transaction(collectionStrings)

  try {
    await trx.step(
      () => arangoCtx.query`
      FOR domain IN domains
        FILTER domain.domain == ${domain}
        UPDATE domain WITH { dmarcOwnership: { orgAcronym: ${orgAcronym}, lastUpdated: DATE_ISO8601(DATE_NOW()) } } IN domains
    `,
    )
  } catch (err) {
    console.error(
      `Transaction step error occurred for dmarc summaries service when updating ownership for domain ${domain}: ${err}`,
    )
    await trx.abort()
    return
  }

  try {
    await trx.commit()
  } catch (err) {
    console.error(`Transaction commit error occurred for dmarc summaries service when updating ownership data: ${err}`)
    await trx.abort()
  }
}

module.exports = {
  updateOwnership,
}
