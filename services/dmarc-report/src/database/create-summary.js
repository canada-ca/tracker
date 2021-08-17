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
    calculatePercentages,
  }) =>
  async ({ date, domain }) => {
    const categoryTotals = await loadCategoryTotals({ domain, date })
    const dkimFailureTable = await loadDkimFailureTable({ domain, date })
    const dmarcFailureTable = await loadDmarcFailureTable({ domain, date })
    const fullPassTable = await loadFullPassTable({ domain, date })
    const spfFailureTable = await loadSpfFailureTable({ domain, date })

    const categoryPercentages = calculatePercentages({ ...categoryTotals })

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
    const collectionStrings = []
    for (const property in collections) {
      collectionStrings.push(property.toString())
    }
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
