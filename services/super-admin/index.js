require('dotenv-safe').config({
  allowEmptyValues: true,
  example: '.env.example',
})

const { DB_PASS: rootPass, DB_URL: url, DB_NAME: databaseName } = process.env

const bcrypt = require('bcrypt')
const { ArangoTools } = require('arango-tools')
const { makeMigrations } = require('./migrations')

const {
  checkForSuperAdminAccount,
  checkForSuperAdminAffiliation,
  checkForSuperAdminOrg,
  createSuperAdminAccount,
  createSuperAdminAffiliation,
  createSuperAdminOrg,
  removeSuperAdminAffiliation,
} = require('./src')

;(async () => {
  // Generate Database information
  const { migrate } = await ArangoTools({ rootPass, url })
  const { query, collections } = await migrate(
    makeMigrations({ databaseName, rootPass }),
  )

  console.info('Checking for super admin account.')

  const admin = await checkForSuperAdminAccount({ query })
  const org = await checkForSuperAdminOrg({ query })
  
  let newAffiliation, newOrg, newAdmin
  if (typeof admin === 'undefined' && typeof org === 'undefined') {
    console.info('Super admin account, and org not found, creating new account.')
    newAdmin = await createSuperAdminAccount({ collections, bcrypt })
    newOrg = await createSuperAdminOrg({ collections })
    newAffiliation = await createSuperAdminAffiliation({ collections, org: newOrg, admin: newAdmin })
    console.info('Super admin account, org, and affiliation creation successful.')
    console.info('Exiting now.')
    return
  }  
  
  if (typeof admin === 'undefined' && typeof org !== 'undefined') {
    console.info('Super admin account not found, Super admin org found. Creating account.')
    newAdmin = await createSuperAdminAccount({ collections, bcrypt })
    console.info('Removing old super admin affiliation.')
    await removeSuperAdminAffiliation({ query })
    console.info('Creating new super admin affiliation')
    newAffiliation = await createSuperAdminAffiliation({ collections, org, admin: newAdmin })
    console.info('Super admin account, and affiliation creation successful.')
    console.info('Exiting now.')
    return
  }

  if (typeof admin !== 'undefined' && typeof org === 'undefined') {
    console.info('Super admin org not found, Super admin account found. Creating super admin org.')
    newOrg = await createSuperAdminOrg({ collections })
    console.info('Removing old super admin affiliation.')
    await removeSuperAdminAffiliation({ query })
    console.info('Creating new super admin affiliation')
    newAffiliation = await createSuperAdminAffiliation({ collections, org: newOrg, admin })
    console.info('Super admin org, and affiliation creation successful.')
    console.info('Exiting now.')

    return
  }

  if (typeof admin !== 'undefined' && typeof org !== 'undefined') {
    console.info('Found super admin account, and org. Checking for affiliation.')
    const affiliation = await checkForSuperAdminAffiliation({ query })
    if (typeof affiliation === 'undefined') {
      console.info('Super admin affiliation not found, creating new affiliation.')
      newAffiliation = await createSuperAdminAffiliation({ collections, org, admin })
      console.info('Super admin affiliation creation successful.')
      console.info('Exiting now.')
      return
    } else {
      console.info('Super admin affiliation found.')
      console.info('Exiting now.')
      return
    }
  }

})()
