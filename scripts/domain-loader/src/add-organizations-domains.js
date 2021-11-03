const {
  checkOrganization,
  createOrganization,
  slugify,
  checkDomain,
  createDomain,
  createClaim,
  checkClaim,
} = require('./helpers')

const addOrganizationsDomains = async ({ db, query, data }) => {
  const requiredCollectionTypes = {
    claims: 'edge',
    domains: 'document',
    organizations: 'document',
    affiliations: 'edge',
  }

  // check if collections exist
  const existingCollections = (await db.listCollections()).map((collection) => {
    return collection.name
  })

  for (const key of Object.keys(requiredCollectionTypes)) {
    console.log(`Checking if collection "${key}" exists`)
    if (!existingCollections.includes(key)) {
      // collection does not exist, create collection
      console.log(
        `Collection "${key} does not exist, creating collection ${key}"`,
      )
      if (requiredCollectionTypes[key] === 'document') {
        // create document collection
        await db.createCollection(key)
      } else {
        // create edge collection
        await db.createEdgeCollection(key)
      }
    } else {
      // collections exists
      console.log(`Collection "${key}" exists`)
    }
  }

  for (const key in data) {
    const trx = await db.beginTransaction(Object.keys(requiredCollectionTypes))
    let org
    org = await checkOrganization({ data, key, query })

    if (!org) {
      org = await createOrganization({ slugify, data, key, trx, query })
    }

    for (const domain of data[key].domains) {
      const checkedDomain = await checkDomain({ query, domain })

      if (!checkedDomain) {
        const savedDomain = await createDomain({ trx, query, domain })

        await createClaim({
          trx,
          query,
          domainId: savedDomain._id,
          orgId: org._id,
        })
      } else {
        const claim = await checkClaim({
          query,
          domainId: checkedDomain._id,
          orgId: org._id,
        })

        if (!claim) {
          await createClaim({
            trx,
            query,
            domainId: checkedDomain._id,
            orgId: org._id,
          })
        }
      }
      console.log({
        org: key,
        domain,
        saved: true,
      })
    }

    try {
      await trx.commit()
    } catch (err) {
      throw new Error(err)
    }
  }
}

module.exports = {
  addOrganizationsDomains,
}
