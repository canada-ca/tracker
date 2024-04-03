const { loadTables } = require('../loaders')
const createSummary =
  ({
    transaction,
    collections,
    query,
    loadCategoryTotals,
    loadDkimFailureTable,
    loadDmarcFailureTable,
    loadFullPassTable,
    loadSpfFailureTable,
  }) =>
  async ({ date, domain }) => {
    const { categoryTotals, dkimFailureTable, dmarcFailureTable, fullPassTable, spfFailureTable, categoryPercentages } =
      await loadTables({
        loadCategoryTotals,
        loadDkimFailureTable,
        loadDmarcFailureTable,
        loadFullPassTable,
        loadSpfFailureTable,
        domain,
        date,
      })

    const summary = {
      ...categoryPercentages,
      categoryTotals,
      detailTables: {
        dkimFailure: dkimFailureTable,
        dmarcFailure: dmarcFailureTable,
        fullPass: fullPassTable,
        spfFailure: spfFailureTable,
      },
    }

    // Generate list of collections names
    const collectionStrings = Object.keys(collections)
    // setup Transaction
    const trx = await transaction(collectionStrings)

    // create summary
    const summaryCursor = await trx.step(
      () => query`
      WITH dmarcSummaries
      INSERT ${summary} INTO dmarcSummaries
      RETURN NEW
    `,
    )

    const summaryDBInfo = await summaryCursor.next()

    // create edge
    await trx.step(
      () => query`
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

    await trx.commit()
  }

module.exports = {
  createSummary,
}
