const upsertSummary =
  ({ transaction, collections, query }) =>
  async ({ date, domain, summaryData }) => {
    // get current summary info
    const edgeCursor = await query`
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
    const collectionStrings = Object.keys(collections)
    // setup Transaction
    const trx = await transaction(collectionStrings)

    // create summary
    await trx.step(
      () => query`
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

    await trx.commit()
  }

module.exports = {
  upsertSummary,
}
