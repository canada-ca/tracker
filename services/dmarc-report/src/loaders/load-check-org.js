async function loadCheckOrg({ arangoCtx, orgAcronymEn }) {
  const orgCursor = await arangoCtx.query`
      FOR org IN organizations
        FILTER org.orgDetails.en.acronym == ${orgAcronymEn}
        RETURN org
    `

  return await orgCursor.next()
}

module.exports = {
  loadCheckOrg,
}
