const createOwnership =
  ({ transaction, collections, query }) =>
  async ({ domain, orgAcronymEn }) => {
    // Generate list of collections names
    const collectionStrings = []
    for (const property in collections) {
      collectionStrings.push(property.toString())
    }
    // setup Transaction
    const trx = await transaction(collectionStrings)

    await trx.step(
      () => query`
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
