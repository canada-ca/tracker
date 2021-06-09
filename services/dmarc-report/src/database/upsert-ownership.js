const upsertOwnership = async ({ ownership, key, query }) => {
  try {
    await query`
      LET givenDomains = ${ownership}
      LET orgAcronym = ${String(key)}

      FOR domain IN givenDomains
          LET domainId = FIRST(
            FOR d IN domains 
            FILTER d.domain == domain 
            RETURN d._id
          )
          FILTER LENGTH(domainId) > 0
              LET ownershipKey = (
                FOR v, e IN 1..1 ANY domainId ownership 
                RETURN e._key
              )
              LET orgId = FIRST(
                FOR org IN organizations 
                FILTER (org.orgDetails.en.acronym == orgAcronym) 
                OR (org.orgDetails.fr.acronym == orgAcronym) 
                RETURN org._id
              )
              FILTER LENGTH(orgId) > 0
              UPSERT { _to: domainId }
                  INSERT { _from: orgId, _to: domainId }
                  UPDATE { _from: orgId, _to: domainId }
                  IN ownership OPTIONS { waitForSync: true }
              RETURN { doc: NEW }
      `
  } catch (err) {
    console.error(
      `Error occurred while inserting/updating ownerships for ${String(
        key,
      )}: ${err}`,
    )
  }
}

module.exports = {
  upsertOwnership,
}
