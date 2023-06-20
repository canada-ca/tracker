const { UNCLAIMED_ORG_ID } = process.env
const { findDomainClaims, findUnclaimedDomains } = require('./database')

const unclaimedCleanupService = async ({ query, log }) => {
  const unclaimedDomains = await findUnclaimedDomains({ query })
  unclaimedDomains.forEach(async ({ domain, _id }) => {
    const claims = await findDomainClaims({ query, domainId: _id })
    if (claims.length > 1) {
      log(`${domain} has been claimed. Removing from unclaimed org.`)
      try {
        await (
          await query`
              FOR v, e IN 1..1 ANY ${UNCLAIMED_ORG_ID} claims
                  FILTER v.domain == ${domain}
                  REMOVE e IN claims
              `
        ).all()
      } catch (err) {
        console.error(`Error while removing claims for domain: ${domain._key}, error: ${err})`)
      }
    }
  })
}

module.exports = {
  unclaimedCleanupService,
}
