const upsertSummary =
  ({ transaction, collections, query }) =>
  async ({ date, domain, categoryTotals, categoryPercentages, detailTables }) => {
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

    const summary = {
      ...categoryPercentages,
      categoryTotals,
      detailTables,
    }

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
            INSERT ${summary}
            UPDATE {
              categoryPercentages: ${summary.categoryPercentages},
              categoryTotals: ${summary.categoryTotals},
              detailTables: {
                dkimFailure: ${summary.detailTables.dkimFailure},
                dmarcFailure: ${summary.detailTables.dmarcFailure},
                fullPass: ${summary.detailTables.fullPass},
                spfFailure: ${summary.detailTables.spfFailure},
              },
              totalMessages: ${summary.totalMessages},
            }
            IN dmarcSummaries
          RETURN NEW
      `,
    )

    await trx.commit()
  }

module.exports = {
  upsertSummary,
}
