const { UNCLAIMED_ORG_ID } = process.env
const { findDomainClaims, findUnclaimedDomains } = require('./database')

const unclaimedCleanupService = async ({ query, log }) => {
  const unclaimedDomains = await findUnclaimedDomains({ query, orgId: UNCLAIMED_ORG_ID })
  log(`Found ${unclaimedDomains.length} unclaimed domains`)
  unclaimedDomains.forEach(async ({ domain, _id: domainId }) => {
    const claims = await findDomainClaims({ query, domainId })
    if (claims.length > 1) {
      log(`Attempting to remove ${domain} from the 'Unclaimed' org...`)
      try {
        await (
          await query`
              FOR v, e IN 1..1 ANY ${UNCLAIMED_ORG_ID} claims
                  FILTER v.domain == ${domain}
                  REMOVE e IN claims
              `
        ).all()
        log(`Successfully removed ${domain} from the 'Unclaimed' org.`)
      } catch (err) {
        console.error(`Error while removing claims for domain: ${domain._key}, error: ${err})`)
      }
    }
  })
}

module.exports = {
  unclaimedCleanupService,
}
