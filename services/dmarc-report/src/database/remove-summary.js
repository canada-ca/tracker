async function removeSummary({ arangoCtx, domain, date }) {
  // Generate list of collections names
  const collectionStrings = Object.keys(arangoCtx.collections)

  // setup Transaction
  const trx = await arangoCtx.transaction(collectionStrings)

  await trx.step(
    () => arangoCtx.query`
      WITH domains, dmarcSummaries, domainsToDmarcSummaries
      LET domainId = FIRST(
        FOR domain IN domains
          FILTER domain.domain == ${domain}
          RETURN domain._id
      )
      LET dmarcSummaryEdges = (
        FOR v, e IN 1..1 OUTBOUND domainId domainsToDmarcSummaries
          FILTER e.startDate == ${date}
          RETURN { edgeKey: e._key, dmarcSummaryId: e._to }
      )
      LET removeDmarcSummaryEdges = (
        FOR dmarcSummaryEdge IN dmarcSummaryEdges
          REMOVE dmarcSummaryEdge.edgeKey IN domainsToDmarcSummaries
      )
      LET removeDmarcSummaries = (
        FOR dmarcSummaryEdge IN dmarcSummaryEdges
          LET key = PARSE_IDENTIFIER(dmarcSummaryEdge.dmarcSummaryId).key
          REMOVE key IN dmarcSummaries
      )
      RETURN true
    `,
  )

  await trx.commit()
}

module.exports = {
  removeSummary,
}
