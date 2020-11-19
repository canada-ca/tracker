const {
  checkForSuperAdminAccount,
  checkForSuperAdminAffiliation,
  checkForSuperAdminOrg,
  createSuperAdminAccount,
  createSuperAdminAffiliation,
  createSuperAdminOrg,
  removeSuperAdminAffiliation,
} = require('./database')

const superAdminService = async ({
  query,
  collections,
  transaction,
  bcrypt,
}) => {
  console.info('Checking for super admin account.')

  // Check to see if default super admin account or org already exists
  const admin = await checkForSuperAdminAccount({ query })
  const org = await checkForSuperAdminOrg({ query })

  let newOrg, newAdmin
  // No super admin account or org is found
  if (typeof admin === 'undefined' && typeof org === 'undefined') {
    console.info(
      'Super admin account, and org not found, creating new account.',
    )
    newAdmin = await createSuperAdminAccount({
      collections,
      transaction,
      bcrypt,
    })
    newOrg = await createSuperAdminOrg({ collections, transaction })
    await createSuperAdminAffiliation({
      collections,
      transaction,
      org: newOrg,
      admin: newAdmin,
    })
    console.info(
      'Super admin account, org, and affiliation creation successful.',
    )
    console.info('Exiting now.')
  } 
  // Admin account is not found, but org is found
  else if (typeof admin === 'undefined' && typeof org !== 'undefined') {
    console.info(
      'Super admin account not found, Super admin org found. Creating account.',
    )
    newAdmin = await createSuperAdminAccount({
      collections,
      transaction,
      bcrypt,
    })
    console.info('Removing old super admin affiliation.')
    await removeSuperAdminAffiliation({ query, collections, transaction })
    console.info('Creating new super admin affiliation')
    await createSuperAdminAffiliation({
      collections,
      transaction,
      org,
      admin: newAdmin,
    })
    console.info('Super admin account, and affiliation creation successful.')
    console.info('Exiting now.')
  } 
  // Account is found but org is not
  else if (typeof admin !== 'undefined' && typeof org === 'undefined') {
    console.info(
      'Super admin org not found, Super admin account found. Creating super admin org.',
    )
    newOrg = await createSuperAdminOrg({ collections, transaction })
    console.info('Removing old super admin affiliation.')
    await removeSuperAdminAffiliation({ query, collections, transaction })
    console.info('Creating new super admin affiliation')
    await createSuperAdminAffiliation({
      collections,
      transaction,
      org: newOrg,
      admin,
    })
    console.info('Super admin org, and affiliation creation successful.')
    console.info('Exiting now.')
  } 
  // Account and org are found
  else {
    console.info(
      'Found super admin account, and org. Checking for affiliation.',
    )
    // Check to see if affiliation exists
    const affiliation = await checkForSuperAdminAffiliation({ query })
    // Affiliation is not found
    if (typeof affiliation === 'undefined') {
      console.info(
        'Super admin affiliation not found, creating new affiliation.',
      )
      await createSuperAdminAffiliation({
        collections,
        transaction,
        org,
        admin,
      })
      console.info('Super admin affiliation creation successful.')
      console.info('Exiting now.')
    } 
    // Affiliation is found
    else {
      console.info('Super admin affiliation found.')
      console.info('Exiting now.')
    }
  }
}

module.exports = {
  superAdminService,
}
