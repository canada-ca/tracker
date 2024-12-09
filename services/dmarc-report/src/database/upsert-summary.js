async function upsertSummary({ arangoCtx, date, domain, summaryData }) {
  // get current summary info
  const edgeCursor = await arangoCtx.query`
      WITH domains, dmarcSummaries, domainsToDmarcSummaries
      LET domainId = FIRST(
        FOR domain IN domains
          FILTER domain.domain == ${domain}
          RETURN domain._id
      )
      FOR item IN domainsToDmarcSummaries
        FILTER item._from == domainId
        FILTER item.startDate == ${date}
        RETURN item._to
    `

  const summaryId = await edgeCursor.next()

  // Generate list of collections names
  const collectionStrings = Object.keys(arangoCtx.collections)
  // setup Transaction
  const trx = await arangoCtx.transaction(collectionStrings)

  // create summary
  try {
    await trx.step(
      () => arangoCtx.query`
        WITH dmarcSummaries
        FOR summary IN dmarcSummaries
          FILTER summary._key == PARSE_IDENTIFIER(${summaryId}).key
          UPSERT { _key: summary._key }
            INSERT ${summaryData}
            UPDATE ${summaryData}
            IN dmarcSummaries
          RETURN NEW
      `,
    )
  } catch (err) {
    console.error(`Transaction step error occurred for dmarc summaries service when upserting summary data: ${err}`)
    await trx.abort()
  }

  try {
    await trx.commit()
  } catch (err) {
    console.error(`Transaction commit error occurred for dmarc summaries service when upserting summary data: ${err}`)
    await trx.abort()
  }
}

module.exports = {
  upsertSummary,
}
