const getNXDomains = async ({ query }) => {
  let cursor
  try {
    cursor = await query`
        FOR domain IN domains
          FILTER domain.rcode == "NXDOMAIN"
          RETURN { "_id": domain._id, "_key": domain._key, "domain": domain.domain }
      `
  } catch (err) {
    throw new Error(`Database error occurred while trying to find NXDOMAIN keys: ${err}`)
  }

  let nxdomainIds
  try {
    nxdomainIds = await cursor.all()
  } catch (err) {
    throw new Error(`Cursor error occurred while trying to find NXDOMAIN keys: ${err}`)
  }

  return nxdomainIds
}

module.exports = {
  getNXDomains,
}
