const { getNewDomains } = require('./database')

const untagNewDomainsService = async ({ query, log }) => {
  const newClaims = await getNewDomains({ query, log })
  log(`Found ${newClaims.length} new claims`)
  // create date for 120 days ago
  const newCutOff = new Date()
  newCutOff.setDate(newCutOff.getDate() - 120)

  const oldClaimKeys = []
  newClaims.forEach((claim) => {
    if (typeof claim?.firstSeen === 'undefined') {
      oldClaimKeys.push(claim._key)
      return
    }
    const claimDate = new Date(claim?.firstSeen)
    if (claimDate < newCutOff) oldClaimKeys.push(claim._key)
  })
  log(`Found ${oldClaimKeys.length} new claims to untag`)

  try {
    query`
        WITH claims
        FOR c IN claims
          FILTER c._key IN ${oldClaimKeys}
          UPDATE c WITH { tags: REMOVE_VALUE(c.tags, 'new-nouveau') } IN claims
      `
  } catch (err) {
    console.error(`Error while untagging new claims, error: ${err})`)
  }
}

module.exports = {
  untagNewDomainsService,
}
