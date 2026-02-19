const { getNewDomains } = require('./database')
const logger = require('./logger')

const untagNewDomainsService = async ({ query }) => {
  const newClaims = await getNewDomains({ query })
  logger.info({ count: newClaims.length }, `New claims found`)
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
  logger.info({ count: oldClaimKeys.length }, 'New claims to untag')

  try {
    query`
        WITH claims
        FOR c IN claims
          FILTER c._key IN ${oldClaimKeys}
          UPDATE c WITH { tags: REMOVE_VALUE(c.tags, 'new-nouveau') } IN claims
      `
  } catch (err) {
    logger.error({ err }, 'Error while untagging new claims')
  }
}

module.exports = {
  untagNewDomainsService,
}
