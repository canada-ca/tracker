const { removeEdges } = require('./database/remove-edges')
const { getNXDomains } = require('./database/get-nxdomains')

const domainCleanupService = async ({ query, log }) => {
  const cleanupDomains = await getNXDomains({ query, log })

  for (const domain of cleanupDomains) {
    console.log(domain.domain)
    // remove claims
    try {
      await removeEdges({
        query,
        vertexSelectorId: domain._id,
        direction: 'ANY',
        edgeCollection: 'claims',
      })
    } catch (err) {
      console.error(`Error while removing claims for domain: ${domain._key}, error: ${err})`)
      continue
    }
    // remove ownerships
    try {
      await removeEdges({
        query,
        vertexSelectorId: domain._id,
        edgeCollection: 'ownership',
        direction: 'ANY',
      })
    } catch (err) {
      console.error(`Error while removing ownerships for domain: ${domain._key}, error: ${err})`)
      continue
    }

    // remove dmarc summaries
    try {
      await removeEdges({
        db,
        vertexSelectorId: domain._id,
        edgeCollection: 'domainsToDmarcSummaries',
        direction: 'ANY',
        vertexCollection: 'dmarcSummaries',
        removeVertices: true,
      })
    } catch (err) {
      console.error(`Error while removing DMARC summaries for domain: ${domain._key}, error: ${err})`)
      continue
    }
    // remove web scans
    try {
      await (
        await query`
        WITH web, webScan, domains
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
      await removeEdges({
        db,
        vertexSelectorId: domain._id,
        edgeCollection: 'domainsDNS',
        direction: 'ANY',
        vertexCollection: 'dns',
        removeVertices: true,
      })
    } catch (err) {
      console.error(`Error while removing dns scans for domain: ${domain._key}, error: ${err})`)
      continue
    }
    // remove domain
    try {
      await (await query`REMOVE ${domain._key} IN domains`).all()
    } catch (err) {
      console.error(`Error while removing domain: ${domain._key}, error: ${err})`)
      continue
    }
    console.log(`Domain "${domain.domain}" and related data successfully removed`)
  }
}

module.exports = {
  domainCleanupService,
}
