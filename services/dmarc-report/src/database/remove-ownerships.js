const removeOwnerships = async ({ query, domain }) => {
  try {
    await query`
      WITH domains, organizations, domains

      LET domainId = FIRST(
        FOR d IN domains 
          FILTER d.domain == ${domain}
          RETURN d._id
      )
      FOR item IN ownership
        FILTER item._to == domainId
        REMOVE { _key: item._key } IN ownership
    `
  } catch (err) {
    console.error(`Error occurred while removing current ownerships: ${err}`)
  }
}

module.exports = {
  removeOwnerships,
}
