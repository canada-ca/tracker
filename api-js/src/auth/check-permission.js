const checkPermission = async (userId, orgId, query) => {
  let cursor

  try {
    cursor = await query`
      FOR affiliation IN affiliations
        FILTER _from == ${orgId}
        FILTER _to == ${userId}
        RETURN affiliation.permission
    `
  } catch (err) {
    console.log(err)
  }

  console.log(cursor)
  return true
}

module.exports = {
  checkPermission,
}
