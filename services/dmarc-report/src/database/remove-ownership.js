const removeOwnership =
  ({ transaction, collections, query }) =>
  async ({ domain, orgAcronymEn }) => {
    // Generate list of collections names
    const collectionStrings = []
    for (const property in collections) {
      collectionStrings.push(property.toString())
    }
    // setup Transaction
    const trx = await transaction(collectionStrings)

    await trx.step(
      () => query`
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
    await trx.step(() => query`
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
    `)

    await trx.commit()
  }

module.exports = {
  removeOwnership,
}
