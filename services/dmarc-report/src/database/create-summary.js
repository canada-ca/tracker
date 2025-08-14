async function createSummary({ arangoCtx, date, domain, summaryData }) {
  // Generate list of collections names
  const collectionStrings = Object.keys(arangoCtx.collections)
  // setup Transaction
  const trx = await arangoCtx.transaction(collectionStrings)

  // create summary
  const summaryCursor = await trx.step(
    () => arangoCtx.query`
      WITH dmarcSummaries
      INSERT MERGE(${summaryData}, { lastUpdated: DATE_ISO8601(DATE_NOW()) } ) INTO dmarcSummaries
      RETURN NEW
    `,
  )

  const summaryDBInfo = await summaryCursor.next()

  // create edge
  try {
    await trx.step(
      () => arangoCtx.query`
      WITH domains, dmarcSummaries, domainsToDmarcSummaries
      LET domainId = FIRST(
        FOR domain IN domains
          FILTER domain.domain == ${domain}
          RETURN domain._id
      )
      INSERT {
        _from: domainId,
        _to: ${summaryDBInfo._id},
        startDate: ${date}
      } INTO domainsToDmarcSummaries
    `,
    )
  } catch (err) {
    console.error(`Transaction step error occurred for dmarc summaries service when creating summary data: ${err}`)
    await trx.abort()
  }

  try {
    await trx.commit()
  } catch (err) {
    console.error(`Transaction commit error occurred for dmarc summaries service when creating summary data: ${err}`)
    await trx.abort()
  }
}

module.exports = {
  createSummary,
}
