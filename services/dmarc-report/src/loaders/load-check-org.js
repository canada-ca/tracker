const loadCheckOrg =
  ({ query }) =>
  async ({ orgAcronymEn }) => {
    const orgCursor = await query`
      FOR org IN organizations
        FILTER org.orgDetails.en.acronym == ${orgAcronymEn}
        RETURN org
    `

    const checkOrg = await orgCursor.next()

    return checkOrg
  }

module.exports = {
  loadCheckOrg,
}
