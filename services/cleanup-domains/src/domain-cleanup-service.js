const { removeEdges } = require('./database/remove-edges')
const { getNXDomains } = require('./database/get-nxdomains')

const domainCleanupService = async ({ query, log }) => {
  const cleanupDomains = await getNXDomains({ query, log })

  for (const domain of cleanupDomains) {
    console.log(domain._id)
    // remove claims
    await removeEdges({
      query,
      vertexSelectorId: domain._id,
      direction: 'ANY',
      edgeCollection: 'claims',
    })
    // remove ownerships
    await removeEdges({
      query,
      vertexSelectorId: domain._id,
      edgeCollection: 'ownership',
      direction: 'ANY',
    })
    // remove dmarc summaries
    await removeEdges({
      db,
      vertexSelectorId: domain._id,
      edgeCollection: 'domainsToDmarcSummaries',
      direction: 'ANY',
      vertexCollection: 'dmarcSummaries',
      removeVertices: true,
    })
    // script: remove scans
    // web
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
    // dns
    await removeEdges({
      db,
      vertexSelectorId: domain._id,
      edgeCollection: 'domainsDNS',
      direction: 'ANY',
      vertexCollection: 'dns',
      removeVertices: true,
    })
    // remove domain
    await (await query`REMOVE ${domain._key} IN domains`).all()
    console.log(`Domain "${domain.domain}" and related data successfully removed`)
  }
}

module.exports = {
  domainCleanupService,
}
