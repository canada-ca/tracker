require('dotenv-safe').config()
const { Database, aql } = require('arangojs')

const {
  FILE = './organization-domains.json',
  DB_PASS: rootPass,
  DB_URL: url,
  DB_NAME: databaseName,
} = process.env

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
    data = require(FILE)
  } catch (err) {
    console.error(err)
    return
  }

  const collections = [
    'affiliations',
    'aggregateGuidanceTags',
    'chartSummaries',
    'chartSummaryCriteria',
    'claims',
    'dkim',
    'dkimGuidanceTags',
    'dkimResults',
    'dkimToDkimResults',
    'dmarc',
    'dmarcGuidanceTags',
    'dmarcSummaries',
    'domains',
    'domainsDKIM',
    'domainsDMARC',
    'domainsHTTPS',
    'domainsSPF',
    'domainsSSL',
    'domainsToDmarcSummaries',
    'https',
    'httpsGuidanceTags',
    'organizations',
    'ownership',
    'scanSummaries',
    'scanSummaryCriteria',
    'spf',
    'spfGuidanceTags',
    'ssl',
    'sslGuidanceTags',
    'users',
  ]

  const db = new Database({
    url,
    databaseName,
    auth: { username: 'root', password: rootPass },
  })

  const query = async function query(strings, ...vars) {
    return db.query(aql(strings, ...vars), {
      count: true,
    })
  }

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
})()
