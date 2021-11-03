const { removeEdges } = require('./helpers')
const { addOrganizationsDomains } = require('./add-organizations-domains')

const alignOrganizationsDomains = async ({ db, query, data }) => {
  // Check if organizations in database are in JSON data
  // remove organization, affiliations, user affiliations, claims, ownerships if not in JSON data

  const organizationsInDb = await (
    await query`FOR org IN organizations RETURN org`
  ).all()
  for (const organization of organizationsInDb) {
    console.log(
      `Checking database organization "${organization.orgDetails.en.name}" against JSON data`,
    )
    if (['super-admin', 'sa'].includes(organization.orgDetails.en.slug)) {
      console.log(
        `Super admin organization "${organization.orgDetails.en.name}" selected, skipping`,
      )
      continue
    }

    const orgFoundInJsonData = Object.keys(data).find((organizationKey) => {
      return (
        data[organizationKey].acronym_en === organization.orgDetails.en.acronym
      )
    })

    if (orgFoundInJsonData) {
      // Organization found, continue
      console.log(
        `Organization "${organization.orgDetails.en.name}" found in JSON data, skipping`,
      )
      continue
    }

    // <----------------- Organization not found, remove organization and all edges for org ---------------->

    console.log(
      `Organization "${organization.orgDetails.en.name}" not found in JSON data, removing`,
    )

    // remove claims
    await removeEdges({
      db,
      vertexSelectorId: organization._id,
      direction: 'ANY',
      edgeCollection: 'claims',
    })
    console.log(`Claims removed from "${organization.orgDetails.en.name}"`)

    // remove ownerships
    await removeEdges({
      db,
      vertexSelectorId: organization._id,
      direction: 'ANY',
      edgeCollection: 'ownership',
    })
    console.log(
      `Organizations removed from "${organization.orgDetails.en.name}"`,
    )

    // remove affiliations
    await removeEdges({
      db,
      vertexSelectorId: organization._id,
      direction: 'ANY',
      edgeCollection: 'affiliations',
    })
    console.log(
      `Affiliations removed from "${organization.orgDetails.en.name}"`,
    )

    // remove organization
    await (await query`REMOVE ${organization._key} IN organizations`).all()
    console.log(
      `Organization "${organization.orgDetails.en.name}" removed from database`,
    )
  }

  console.log('Done handling organization removal')

  // <------------------------------ done removing organizations ------------------------------------>

  // Check if domains in database are in JSON data
  // remove domain, claims, ownership, scan data, summaries, etc if not in JSON data

  console.log('Starting domain/claim removal')

  // loop over domains in DB
  const domainsInDb = await (
    await query`FOR domain IN domains RETURN domain`
  ).all()

  // format to:
  // { domain1: ['ORG-ACRO1'], domain2: ['ORG-ACRO1'] }
  const orgsClaimingDomainAcronyms = Object.keys(data).reduce(
    (prev, currentKey) => {
      data[currentKey].domains.forEach((domain) => {
        if (prev[domain] == null) {
          prev[domain] = [data[currentKey].acronym_en]
          return
        }
        prev[domain].push(data[currentKey].acronym_en)
      })
      return prev
    },
    {},
  )

  for (const domain of domainsInDb) {
    // remove domain claims which don't exist in JSON data
    const claimRemovalParams = {
      domainId: domain._id,
    }
    const jsonOrgDomainClaimsString =
      JSON.stringify(orgsClaimingDomainAcronyms[domain.domain]) ||
      JSON.stringify([])
    await (
      await db.query(
        `
        WITH organizations
        FOR v, e IN 1..1 ANY @domainId claims
          FILTER v.orgDetails.en.acronym NOT IN ${jsonOrgDomainClaimsString}
          REMOVE e IN claims`,
        claimRemovalParams,
      )
    ).all()

    if (orgsClaimingDomainAcronyms[domain.domain]) {
      // Domain found, don't delete
      console.log(
        `Claims for domain "${domain.domain}" found in JSON data, not deleting domain`,
      )
      delete orgsClaimingDomainAcronyms[domain.domain]
      continue
    }

    // <-------------------- Domain not found, remove the follow: ---------------------->
    // remove:
    // claims edges
    // ownership edges
    // domainsDKIM edges and vertices
    // domainsDMARC edges and vertices
    // domainsHTTPS edges and vertices
    // domainsSPF edges and vertices
    // domainsSSL edges and vertices
    // domainsToDmarcSummaries edges and vertices
    // the domain itself

    console.log(
      `Domain "${domain.domain}" not found in JSON data, removing domain and domain data`,
    )

    await removeEdges({
      db,
      vertexSelectorId: domain._id,
      edgeCollection: 'claims',
      direction: 'ANY',
    })

    await removeEdges({
      db,
      vertexSelectorId: domain._id,
      edgeCollection: 'ownership',
      direction: 'ANY',
    })

    await removeEdges({
      db,
      vertexSelectorId: domain._id,
      edgeCollection: 'domainsDKIM',
      direction: 'ANY',
      vertexCollection: 'dkim',
      removeVertices: true,
    })

    await removeEdges({
      db,
      vertexSelectorId: domain._id,
      edgeCollection: 'domainsDMARC',
      direction: 'ANY',
      vertexCollection: 'dmarc',
      removeVertices: true,
    })

    await removeEdges({
      db,
      vertexSelectorId: domain._id,
      edgeCollection: 'domainsHTTPS',
      direction: 'ANY',
      vertexCollection: 'https',
      removeVertices: true,
    })

    await removeEdges({
      db,
      vertexSelectorId: domain._id,
      edgeCollection: 'domainsSPF',
      direction: 'ANY',
      vertexCollection: 'spf',
      removeVertices: true,
    })

    await removeEdges({
      db,
      vertexSelectorId: domain._id,
      edgeCollection: 'domainsSSL',
      direction: 'ANY',
      vertexCollection: 'ssl',
      removeVertices: true,
    })

    await removeEdges({
      db,
      vertexSelectorId: domain._id,
      edgeCollection: 'domainsToDmarcSummaries',
      direction: 'ANY',
      vertexCollection: 'dmarcSummaries',
      removeVertices: true,
    })

    await (await query`REMOVE ${domain._key} IN domains`).all()
  }

  // <------------------------------ done removing domains ------------------------------------>

  // Add organizations and domains from JSON data
  // addOrganizationsDomains() can add new organizations and domains, as well as add
  //    claims to newly created or already existing organizations/domains

  // Add organizations and domains
  await addOrganizationsDomains({ db, query, data })
}
module.exports = {
  alignOrganizationsDomains,
}
