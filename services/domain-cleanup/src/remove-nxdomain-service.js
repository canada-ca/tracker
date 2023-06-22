const { getNXDomains } = require('./database')

const removeNXDomainService = async ({ query, log }) => {
  const cleanupDomains = await getNXDomains({ query, log })
  log(`Found ${cleanupDomains.length} domains to cleanup`)
  for (const domain of cleanupDomains) {
    // remove ownerships
    try {
      await (
        await query`
          WITH ownership, domains
          FOR v, e IN 1..1 ANY ${domain._id} ownership
            REMOVE e IN ownership
        `
      ).all()
    } catch (err) {
      console.error(`Error while removing ownerships for domain: ${domain._key}, error: ${err})`)
      continue
    }

    // remove dmarc summaries
    try {
      await (
        await query`
          WITH dmarcSummaries, domainsToDmarcSummaries, domains
          FOR v, e IN 1..1 ANY ${domain._id} domainsToDmarcSummaries
            REMOVE e IN domainsToDmarcSummaries
            REMOVE v IN dmarcSummaries`
      ).all()
    } catch (err) {
      console.error(`Error while removing DMARC summaries for domain: ${domain._key}, error: ${err})`)
      continue
    }

    // remove web scans
    try {
      await (
        await query`
        WITH web, webScan, domainsWeb, webToWebScans, domains
        FOR webV, domainsWebEdge IN 1..1 OUTBOUND ${domain._id} domainsWeb
          FOR webScanV, webToWebScansV In 1..1 OUTBOUND webV._id webToWebScans
            REMOVE webScanV IN webScan
            REMOVE webToWebScansV IN webToWebScans
            OPTIONS { waitForSync: true }
          REMOVE webV IN web
          REMOVE domainsWebEdge IN domainsWeb
          OPTIONS { waitForSync: true }
      `
      ).all()
    } catch (err) {
      console.error(`Error while removing web scans for domain: ${domain._key}, error: ${err})`)
      continue
    }

    // remove dns scans
    try {
      await (
        await query`
          WITH dns, domainsDNS, domains
          FOR v, e IN 1..1 ANY ${domain._id} domainsDNS
            REMOVE e IN domainsDNS
            REMOVE v IN dns
      `
      ).all()
    } catch (err) {
      console.error(`Error while removing dns scans for domain: ${domain._key}, error: ${err})`)
      continue
    }

    // remove claims
    try {
      await (
        await query`
        WITH claims, domains
        FOR v, e IN 1..1 ANY ${domain._id} claims
          REMOVE e IN claims
        `
      ).all()
    } catch (err) {
      console.error(`Error while removing claims for domain: ${domain._key}, error: ${err})`)
      continue
    }

    // remove domain
    try {
      await (
        await query`
        WITH domains
        REMOVE ${domain._key} IN domains
      `
      ).all()
    } catch (err) {
      console.error(`Error while removing domain: ${domain._key}, error: ${err})`)
      continue
    }
    log(`Domain "${domain.domain}" and related data successfully removed`)
  }
}

module.exports = {
  removeNXDomainService,
}
