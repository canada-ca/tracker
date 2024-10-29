const createSuperAdminAffiliation = async ({
  collections,
  transaction,
  org,
  admin,
}) => {
  // Generate list of collections names
  const collectionStrings = []
  for (const property in collections) {
    collectionStrings.push(property.toString())
  }

  // Setup Transaction
  const trx = await transaction(collectionStrings)

  let affiliation
  try {
    await trx.step(async () => {
      affiliation = await collections.affiliations.save({
        _from: org._id,
        _to: admin._id,
        permission: 'super_admin',
        defaultSA: true,
      })
    })
  } catch (err) {
    await trx.abort()
    throw new Error(
      `Transaction step error occurred while creating new super admin affiliation: ${err}`,
    )
  }

  try {
    await trx.commit()
  } catch (err) {
    await trx.abort()
    throw new Error(
      `Transaction commit error occurred while creating new super admin affiliation: ${err}`,
    )
  }

  return affiliation
}

module.exports = {
  createSuperAdminAffiliation,
}
