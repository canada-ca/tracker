const findVulnerabilitiesByOrgId = async ({ query, orgId }) => {
  let cursor
  try {
    cursor = await query`
        RETURN COUNT(
          FOR v, e IN 1..1 OUTBOUND ${orgId} claims
            OPTIONS {order: "bfs"}
            FILTER v.archived != true
            FILTER v.cveDetected == true
            RETURN v._id
        )
    `
  } catch (err) {
    throw new Error(`Database error occurred while trying to find vulnerable assets: ${err}`)
  }

  let vulnerableAssets
  try {
    vulnerableAssets = await cursor.next()
  } catch (err) {
    throw new Error(`Cursor error occurred while trying to find vulnerable assets: ${err}`)
  }

  return vulnerableAssets
}

module.exports = {
  findVulnerabilitiesByOrgId,
}
