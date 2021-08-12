require('dotenv-safe').config({
  example: './.env.example',
  path: './.env',
})
const { DB_PASS: rootPass, DB_URL: url, DB_NAME: databaseName } = process.env

const { ensure } = require('arango-tools')

const { databaseOptions } = require('./database-options')
const {
  checkClaimCount,
  checkDomain,
  checkOrganization,
  createClaim,
  createDomain,
  createOrganization,
  slugify,
} = require('./src')

;(async () => {
  let data
  try {
    data = require('./organization-domains.json')
  } catch (err) {
    console.error(err)
    return
  }

  const { query, collections, transaction } = await ensure({
    type: 'database',
    name: databaseName,
    url,
    rootPassword: rootPass,
    options: databaseOptions({ rootPass }),
  })

  // setup transactions
  // Generate list of collections names
  const collectionStrings = []
  for (const property in collections) {
    collectionStrings.push(property.toString())
  }

  // Setup Transaction
  const trx = await transaction(collectionStrings)

  for (const key in data) {
    const org = await checkOrganization({ data, key, query })

    if (typeof org === 'undefined') {
      createOrganization({ slugify, data, key, trx, query })
    } else {
      console.info(`\tOrg found.`)
    }

    for (const domain of data[key].domains) {
      const checkedDomain = await checkDomain({ query, domain })

      if (typeof checkedDomain === 'undefined') {
        const savedDomain = await createDomain({ trx, query, domain })

        await createClaim({
          trx,
          query,
          domainId: savedDomain._id,
          orgId: org._id,
        })
      } else {
        console.log(`\tDomain already found.`)
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
    }

    try {
      trx.commit()
    } catch (err) {
      throw new Error(err)
    }
  }
})()
