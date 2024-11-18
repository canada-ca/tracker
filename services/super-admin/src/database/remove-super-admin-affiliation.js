const removeSuperAdminAffiliation = async ({
  query,
  collections,
  transaction,
}) => {
  // Generate list of collections names
  const collectionStrings = []
  for (const property in collections) {
    collectionStrings.push(property.toString())
  }

  // Setup Transaction
  const trx = await transaction(collectionStrings)

  try {
    await trx.step(async () => {
      await query`
        FOR affiliation IN affiliations
          FILTER affiliation.defaultSA == true
          REMOVE affiliation IN affiliations
          RETURN OLD
      `
    })
  } catch (err) {
    await trx.abort()
    throw new Error(
      `Transaction step error occurred well removing super admin affiliation: ${err}`,
    )
  }

  try {
    await trx.commit()
  } catch (err) {
    await trx.abort()
    throw new Error(
      `Transaction commit error occurred while removing new super admin affiliation: ${err}`,
    )
  }
}

module.exports = {
  removeSuperAdminAffiliation,
}
