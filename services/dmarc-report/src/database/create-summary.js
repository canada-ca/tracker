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
    let categoryTotals
    let dkimFailureTable
    let dmarcFailureTable
    let fullPassTable
    let spfFailureTable

    if (date === 'thirtyDays') {
      categoryTotals = await loadCategoryTotals({ domain, date: 'thirty_days' })
      dkimFailureTable = await loadDkimFailureTable({
        domain,
        date: 'thirty_days',
      })
      dmarcFailureTable = await loadDmarcFailureTable({
        domain,
        date: 'thirty_days',
      })
      fullPassTable = await loadFullPassTable({ domain, date: 'thirty_days' })
      spfFailureTable = await loadSpfFailureTable({
        domain,
        date: 'thirty_days',
      })
    } else {
      categoryTotals = await loadCategoryTotals({ domain, date })
      dkimFailureTable = await loadDkimFailureTable({ domain, date })
      dmarcFailureTable = await loadDmarcFailureTable({ domain, date })
      fullPassTable = await loadFullPassTable({ domain, date })
      spfFailureTable = await loadSpfFailureTable({ domain, date })
    }

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
