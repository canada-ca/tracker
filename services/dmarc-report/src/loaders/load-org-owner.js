const loadOrgOwner =
  ({ query }) =>
  async ({ domain }) => {
    const cursor = await query`
      WITH domains, organizations, ownership
      LET domainId = FIRST(
        FOR domain IN domains
          FILTER domain.domain == ${domain}
          RETURN domain._id
      )
      LET orgId = FIRST (
        FOR item IN ownership
          FILTER item._to == domainId
          RETURN item._from
      )
      FOR org IN organizations
        FILTER org._id == orgId
        RETURN org.orgDetails.en.acronym
    `

    const data = await cursor.next()

    return data
  }

module.exports = {
  loadOrgOwner,
}
