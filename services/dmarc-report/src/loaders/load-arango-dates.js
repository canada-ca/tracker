const loadArangoDates =
  ({ query }) =>
  async ({ domain }) => {
    const dbStartDatesCursor = await query`
      LET domainId = FIRST(
        FOR domain in domains
          FILTER domain.domain == ${domain}
          RETURN domain._id
      )
      RETURN SORTED(UNIQUE(
          FOR edge IN domainsToDmarcSummaries
              FILTER edge.startDate != "thirtyDays"
              FILTER edge._from == domainId
              RETURN edge.startDate
      ))
    `

    const dbStartDates = await dbStartDatesCursor.next()

    return dbStartDates.sort()
  }

module.exports = {
  loadArangoDates,
}
