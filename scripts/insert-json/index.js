require('dotenv').config()

const { DB_PASS: rootPass, DB_URL: url, DB_NAME: databaseName } = process.env

const { ensure } = require('arango-tools')

const data = require('./dmarc-domains.json')
const { slugify } = require('./src')
const { databaseOptions } = require('./database-options')

;(async () => {
  const { query, collections } = await ensure({
    type: 'database',
    name: databaseName,
    url,
    rootPassword: rootPass,
    options: databaseOptions({ rootPass }),
  })

  for (key in data) {
    // console.log(`Working on org: ${key}`)

    const orgStruct = {
      verified: true,
      summaries: {
        web: {
          pass: 0,
          fail: 0,
          total: 0,
        },
        mail: {
          pass: 0,
          fail: 0,
          total: 0,
        },
      },
      orgDetails: {
        en: {
          slug: slugify(data[key]['organization_en']),
          acronym: data[key]['acronym_en'],
          name: data[key]['organization_en'],
          zone: 'FED',
          sector: 'TBS',
          country: 'Canada',
          province: 'Ontario',
          city: 'Ottawa',
        },
        fr: {
          slug: slugify(data[key]['organization_fr']),
          acronym: data[key]['acronym_fr'],
          name: data[key]['organization_fr'],
          zone: 'FED',
          sector: 'TBS',
          country: 'Canada',
          province: 'Ontario',
          city: 'Ottawa',
        },
      },
    }

    let org
    try {
      const orgCursor = await query`
        WITH organizations
        FOR org IN organizations
          FILTER org.orgDetails.en.acronym == ${data[key]['acronym_en']}
          OR org.orgDetails.fr.acronym == ${data[key]['acronym_fr']}
          RETURN org
      `
      org = await orgCursor.next()
    } catch (err) {}

    if (typeof org === 'undefined') {
      console.log(`\tOrg not found creating it from scratch.`)
      try {
        org = await query`
          WITH organizations, domains, claims
          INSERT ${orgStruct} INTO organizations
          RETURN NEW
        `
        org = await org.next()
      } catch (err) {}
    } else {
      console.log(`\tOrg found.`)
    }

    data[key]['domains'].forEach(async (domain) => {
      let domainCursor, savedDomain
      try {
        domainCursor = await query`
          WITH domains
          FOR domain IN domains
            FILTER domain.domain == ${domain}
            RETURN domain
        `
        savedDomain = await domainCursor.next()
      } catch (err) {}

      if (typeof savedDomain === 'undefined') {
        console.log(`\tCreating domain: ${domain}.`)
        const domainStruct = {
          domain: domain,
          selectors: [],
          status: {
            dkim: 'fail',
            dmarc: 'fail',
            https: 'fail',
            spf: 'fail',
            ssl: 'fail',
          },
          lastRan: '',
        }

        try {
          savedDomain = await query`
            WITH domains, claims, organizations
            INSERT ${domainStruct} INTO domains
            RETURN NEW
          `
          savedDomain = await savedDomain.next()
        } catch (err) {}

        console.log(`\tAdding claim`)
        try {
          await query`
            WITH domains, claims, organizations
            INSERT {
              _to: ${savedDomain._id},
              _from: ${org._id}
            } INTO claims
          `
        } catch (err) {}
      } else {
        console.log(`\tDomain already found.`)
        let claimCursor
        try {
          claimCursor = await query`
            WITH claims, domains, organizations
            FOR v,e IN 1..1 ANY ${savedDomain._id} claims
              RETURN v
          `
        } catch (err) {}

        if (claimCursor.count == 0) {
          console.log(`\tAdding claim`)
          try {
            await query`
              WITH domains, claims, organizations
              INSERT {
                _to: ${savedDomain._id},
                _from: ${org._id}
              } INTO claims
            `
          } catch (err) {}
        }
      }
    })

    const userCursor = await query`
      FOR user IN users
        RETURN user
    `
    userCursor.forEach(async (user) => {
      await collections.affiliations.save({
        _to: user._id,
        _from: org._id,
        permission: 'admin',
      })
    })
  }
})()
