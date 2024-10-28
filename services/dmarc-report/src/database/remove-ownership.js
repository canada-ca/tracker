async function removeOwnership({ arangoCtx, domain, orgAcronymEn }) {
  // Generate list of collections names
  const collectionStrings = Object.keys(arangoCtx.collections)
  // setup Transaction
  const trx = await arangoCtx.transaction(collectionStrings)

  try {
    await trx.step(
      () => arangoCtx.query`
      WITH domains, organizations, ownership
      LET domainId = FIRST(
        FOR domain IN domains
          FILTER domain.domain == ${domain}
          RETURN domain._id
      )
      LET orgId = FIRST(
        FOR org IN organizations
          FILTER org.orgDetails.en.acronym == ${orgAcronymEn}
          RETURN org._id
      )
      FOR owner IN ownership
        FILTER owner._from == orgId
        FILTER owner._to == domainId
        REMOVE { _key: owner._key } IN ownership
    `,
    )

    // remove dmarcSummaries and dmarcSummaryEdges
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
  } catch (err) {
    console.error(`Transaction step error occurred for dmarc summaries service when removing ownership data: ${err}`)
    await trx.abort()
  }

  try {
    await trx.commit()
  } catch (err) {
    console.error(`Transaction commit error occurred for dmarc summaries service when removing ownership data: ${err}`)
    await trx.abort()
  }
}

module.exports = {
  removeOwnership,
}
