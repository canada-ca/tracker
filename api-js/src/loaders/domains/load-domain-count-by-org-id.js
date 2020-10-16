const { aql } = require('arangojs')

const domainLoaderCountByOrgId = (query, userId) => async ({
  orgId,
}) => {

  const userDBId = `users/${userId}`

  let domainsCursor
  try {
    domainsCursor = await query`
    FOR v, e IN 1..1 OUTBOUND ${orgId} claims RETURN True
    `
  } catch (err) {
    console.error(
      `Database error occurred while user: ${userId} was trying to query affiliated domains in loadDomainCountByOrgId.`,
    )
    throw new Error(
      'Database error occurred while querying domains. Please try again.',
    )
  }
  return domainsCursor.count
}

module.exports = {
  domainLoaderCountByOrgId,
}
