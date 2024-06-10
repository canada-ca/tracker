async function createOwnership({ arangoCtx, domain, orgAcronymEn }) {
  // Generate list of collections names
  const collectionStrings = Object.keys(arangoCtx.collections)

  // setup Transaction
  const trx = await arangoCtx.transaction(collectionStrings)

  await trx.step(
    () => arangoCtx.query`
      WITH domains, organizations, ownership
      LET domainId = FIRST(
        FOR domain IN domains
          FILTER domain.domain == ${domain}
          RETURN domain._id
      )
      LET orgId = FIRST(
        FOR org IN organizations
          FILTER org.orgDetails.en.acronym == ${orgAcronymEn}
          RETURN org._id
      )
      INSERT {
        _from: orgId,
        _to: domainId,
      } INTO ownership
    `,
  )

  await trx.commit()
}

module.exports = {
  createOwnership,
}
