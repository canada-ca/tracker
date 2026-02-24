const { UNCLAIMED_ORG_ID } = process.env
const { findDomainClaims, findUnclaimedDomains } = require('./database')
const logger = require('./logger')

const unclaimedCleanupService = async ({ query }) => {
  const unclaimedDomains = await findUnclaimedDomains({ query, orgId: UNCLAIMED_ORG_ID })
  logger.info({ count: unclaimedDomains.length }, 'Found unclaimed domains')
  for (const { domain, _id: domainId } of unclaimedDomains) {
    const claims = await findDomainClaims({ query, domainId })
    if (claims.length > 1) {
      logger.info({ domain }, "Attempting to remove domain from the 'Unclaimed' org")
      try {
        await (
          await query`
              FOR v, e IN 1..1 ANY ${UNCLAIMED_ORG_ID} claims
                  FILTER v.domain == ${domain}
                  REMOVE e IN claims
              `
        ).all()
        logger.info({ domain }, "Successfully removed domain from the 'Unclaimed' org.")
      } catch (err) {
        logger.error({ err, domain }, "Error while removing claims for domain from the 'Unclaimed' org")
      }
    }
  }
}

module.exports = {
  unclaimedCleanupService,
}
