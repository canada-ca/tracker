async function removeOwnershipAndSummaries({ arangoCtx, domain }) {
  const collectionStrings = Object.keys(arangoCtx.collections)
  const trx = await arangoCtx.transaction(collectionStrings)

  try {
    await trx.step(
      () => arangoCtx.query`
      FOR domain IN domains
        FILTER domain.domain == ${domain}
        UPDATE domain WITH { dmarcOwnership: { orgAcronym: null, lastUpdated: DATE_ISO8601(DATE_NOW()) }, sendsEmail: "unknown" } IN domains
    `,
    )
  } catch (err) {
    console.error(
      `Transaction step error occurred for dmarc summaries service when removing ownership from domain ${domain}: ${err}`,
    )
    await trx.abort()
    return
  }

  try {
    await trx.step(
      () => arangoCtx.query`
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
    console.error(
      `Transaction step error occurred for dmarc summaries service when removing summaries from domain ${domain}: ${err}`,
    )
    await trx.abort()
    return
  }

  try {
    await trx.commit()
  } catch (err) {
    console.error(`Transaction commit error occurred for dmarc summaries service when removing ownership data: ${err}`)
    await trx.abort()
  }
}

module.exports = {
  removeOwnershipAndSummaries,
}
