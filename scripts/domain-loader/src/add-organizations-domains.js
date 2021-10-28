const {
  checkOrganization,
  createOrganization,
  slugify,
  checkDomain,
  createDomain,
  createClaim,
  checkClaimCount,
} = require('./helpers')

const addOrganizationsDomains = async ({ db, query, data }) => {
  const collections = ['claims', 'domains', 'organizations']

  for (const key in data) {
    const trx = await db.beginTransaction(collections)
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
        const claimCount = await checkClaimCount({
          query,
          domainId: checkedDomain._id,
        })

        if (claimCount === 0) {
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
      trx.commit()
    } catch (err) {
      throw new Error(err)
    }
  }
}

module.exports = {
  addOrganizationsDomains,
}
