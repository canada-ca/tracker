const checkOrganization = async ({ data, key, query }) => {
  console.info(`\tChecking organization: ${data[key].acronym_en}.`)

  const orgCursor = await query`
    WITH organizations
    FOR org IN organizations
      FILTER org.orgDetails.en.acronym == ${data[key].acronym_en}
      OR org.orgDetails.fr.acronym == ${data[key].acronym_fr}
      RETURN org
  `

  const org = await orgCursor.next()

  return org
}

module.exports = {
  checkOrganization,
}
