async function createSummary({ arangoCtx, date, domain, summaryData }) {
  // Generate list of collections names
  const collectionStrings = Object.keys(arangoCtx.collections)
  // setup Transaction
  const trx = await arangoCtx.transaction(collectionStrings)

  // create summary
  const summaryCursor = await trx.step(
    () => arangoCtx.query`
      WITH dmarcSummaries
      INSERT ${summaryData} INTO dmarcSummaries
      RETURN NEW
    `,
  )

  const summaryDBInfo = await summaryCursor.next()

  // create edge
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

  await trx.commit()
}

module.exports = {
  createSummary,
}
