const { getNXDomains } = require('./database')
const logger = require('./logger')

const removeNXDomainService = async ({ query }) => {
  const cleanupDomains = await getNXDomains({ query })
  logger.info({ count: cleanupDomains.length }, `Found domains to cleanup`)
  for (const domainDoc of cleanupDomains) {
    const domainId = domainDoc._id
    const domain = domainDoc.domain
    // remove favourites
    try {
      await (
        await query`
          WITH favourites, domains
          FOR v, e IN 1..1 ANY ${domainId} favourites
            REMOVE e IN favourites
        `
      ).all()
    } catch (err) {
      logger.error({ err, domain }, `Error while removing favourites for domain`)
      continue
    }

    // remove ownerships
    try {
      await (
        await query`
          WITH ownership, domains
          FOR v, e IN 1..1 ANY ${domainId} ownership
            REMOVE e IN ownership
        `
      ).all()
    } catch (err) {
      logger.error({ err, domain }, `Error while removing ownerships for domain`)
      continue
    }

    // remove dmarc summaries
    try {
      await (
        await query`
          WITH dmarcSummaries, domainsToDmarcSummaries, domains
          FOR v, e IN 1..1 ANY ${domainId} domainsToDmarcSummaries
            REMOVE e IN domainsToDmarcSummaries
            REMOVE v IN dmarcSummaries`
      ).all()
    } catch (err) {
      logger.error({ err, domain }, `Error while removing DMARC summaries for domain`)
      continue
    }

    // remove web scans
    try {
      await (
        await query`
        WITH web, webScan, domainsWeb, webToWebScans, domains
        FOR webV, domainsWebEdge IN 1..1 OUTBOUND ${domainId} domainsWeb
          LET removeWebScansQuery = (
            FOR webScanV, webToWebScansE In 1..1 OUTBOUND webV._id webToWebScans
              REMOVE webScanV IN webScan
              REMOVE webToWebScansE IN webToWebScans
              OPTIONS { waitForSync: true }
          )
          REMOVE webV IN web
          REMOVE domainsWebEdge IN domainsWeb
          OPTIONS { waitForSync: true }
      `
      ).all()
    } catch (err) {
      logger.error({ err, domain }, `Error while removing web scans for domain`)
      continue
    }

    // remove dns scans
    try {
      await (
        await query`
          WITH dns, domainsDNS, domains
          FOR v, e IN 1..1 ANY ${domainId} domainsDNS
            REMOVE e IN domainsDNS
            REMOVE v IN dns
      `
      ).all()
    } catch (err) {
      logger.error({ err, domain }, `Error while removing dns scans for domain`)
      continue
    }

    // remove claims
    try {
      await (
        await query`
        WITH claims, domains
        FOR v, e IN 1..1 ANY ${domainId} claims
          REMOVE e IN claims
        `
      ).all()
    } catch (err) {
      logger.error({ err, domain }, `Error while removing claims for domain`)
      continue
    }

    // remove domain
    try {
      await (
        await query`
        WITH domains
        REMOVE ${domainDoc._key} IN domains
      `
      ).all()
    } catch (err) {
      logger.error({ err, domain }, `Error while removing domain`)
      continue
    }
    logger.info({ domain }, 'Domain and related data successfully removed')
  }
}

module.exports = {
  removeNXDomainService,
}
