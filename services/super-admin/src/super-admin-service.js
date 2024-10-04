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
  log,
}) => {
  log('Checking for super admin account.')

  // Check to see if default super admin account or org already exists
  const admin = await checkForSuperAdminAccount({ query })
  const org = await checkForSuperAdminOrg({ query })

  let newOrg, newAdmin
  // No super admin account or org is found
  if (typeof admin === 'undefined' && typeof org === 'undefined') {
    log('Super admin account, and org not found, creating new account.')
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
    log('Super admin account, org, and affiliation creation successful.')
    log('Exiting now.')
  }
  // Admin account is not found, but org is found
  else if (typeof admin === 'undefined' && typeof org !== 'undefined') {
    log(
      'Super admin account not found, Super admin org found. Creating account.',
    )
    newAdmin = await createSuperAdminAccount({
      collections,
      transaction,
      bcrypt,
    })
    log('Removing old super admin affiliation.')
    await removeSuperAdminAffiliation({ query, collections, transaction })
    log('Creating new super admin affiliation')
    await createSuperAdminAffiliation({
      collections,
      transaction,
      org,
      admin: newAdmin,
    })
    log('Super admin account, and affiliation creation successful.')
    log('Exiting now.')
  }
  // Account is found but org is not
  else if (typeof admin !== 'undefined' && typeof org === 'undefined') {
    log(
      'Super admin org not found, Super admin account found. Creating super admin org.',
    )
    newOrg = await createSuperAdminOrg({ collections, transaction })
    log('Removing old super admin affiliation.')
    await removeSuperAdminAffiliation({ query, collections, transaction })
    log('Creating new super admin affiliation')
    await createSuperAdminAffiliation({
      collections,
      transaction,
      org: newOrg,
      admin,
    })
    log('Super admin org, and affiliation creation successful.')
    log('Exiting now.')
  }
  // Account and org are found
  else {
    log('Found super admin account, and org. Checking for affiliation.')
    // Check to see if affiliation exists
    const affiliation = await checkForSuperAdminAffiliation({ query })
    // Affiliation is not found
    if (typeof affiliation === 'undefined') {
      log('Super admin affiliation not found, creating new affiliation.')
      await createSuperAdminAffiliation({
        collections,
        transaction,
        org,
        admin,
      })
      log('Super admin affiliation creation successful.')
      log('Exiting now.')
    }
    // Affiliation is found
    else {
      log('Super admin affiliation found.')
      log('Exiting now.')
    }
  }
}

module.exports = {
  superAdminService,
}
