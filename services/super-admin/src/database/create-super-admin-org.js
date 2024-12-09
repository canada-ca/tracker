const {
  SA_ORG_EN_SLUG,
  SA_ORG_EN_ACRONYM,
  SA_ORG_EN_NAME,
  SA_ORG_EN_ZONE,
  SA_ORG_EN_SECTOR,
  SA_ORG_EN_COUNTRY,
  SA_ORG_EN_PROVINCE,
  SA_ORG_EN_CITY,
  SA_ORG_FR_SLUG,
  SA_ORG_FR_ACRONYM,
  SA_ORG_FR_NAME,
  SA_ORG_FR_ZONE,
  SA_ORG_FR_SECTOR,
  SA_ORG_FR_COUNTRY,
  SA_ORG_FR_PROVINCE,
  SA_ORG_FR_CITY,
} = process.env

const createSuperAdminOrg = async ({ collections, transaction }) => {
  // Generate list of collections names
  const collectionStrings = []
  for (const property in collections) {
    collectionStrings.push(property.toString())
  }

  // Setup Transaction
  const trx = await transaction(collectionStrings)

  let org
  try {
    await trx.step(async () => {
      org = await collections.organizations.save({
        verified: false,
        orgDetails: {
          en: {
            slug: SA_ORG_EN_SLUG,
            acronym: SA_ORG_EN_ACRONYM,
            name: SA_ORG_EN_NAME,
            zone: SA_ORG_EN_ZONE,
            sector: SA_ORG_EN_SECTOR,
            country: SA_ORG_EN_COUNTRY,
            province: SA_ORG_EN_PROVINCE,
            city: SA_ORG_EN_CITY,
          },
          fr: {
            slug: SA_ORG_FR_SLUG,
            acronym: SA_ORG_FR_ACRONYM,
            name: SA_ORG_FR_NAME,
            zone: SA_ORG_FR_ZONE,
            sector: SA_ORG_FR_SECTOR,
            country: SA_ORG_FR_COUNTRY,
            province: SA_ORG_FR_PROVINCE,
            city: SA_ORG_FR_CITY,
          },
        },
      })
    })
  } catch (err) {
    await trx.abort()
    throw new Error(
      `Transaction step error occurred while creating new super admin org: ${err}`,
    )
  }

  try {
    await trx.commit()
  } catch (err) {
    await trx.abort()
    throw new Error(
      `Transaction commit error occurred while creating new super admin org: ${err}`,
    )
  }

  return org
}

module.exports = {
  createSuperAdminOrg,
}
