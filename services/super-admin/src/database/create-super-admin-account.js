const { SA_USER_USERNAME, SA_USER_PASSWORD, SA_USER_DISPLAY_NAME, SA_USER_LANG } = process.env

const createSuperAdminAccount = async ({ collections, transaction, bcrypt }) => {
  // Generate list of collections names
  const collectionStrings = []
  for (const property in collections) {
    collectionStrings.push(property.toString())
  }

  // Setup Transaction
  const trx = await transaction(collectionStrings)

  let user
  try {
    await trx.step(async () => {
      user = await collections.users.save({
        displayName: SA_USER_DISPLAY_NAME,
        userName: String(SA_USER_USERNAME).toLowerCase(),
        password: bcrypt.hashSync(SA_USER_PASSWORD, 10),
        phoneValidated: false,
        emailValidated: false,
        failedLoginAttempts: 0,
        tfaSendMethod: 'none',
      })
    })
  } catch (err) {
    throw new Error(`Transaction step error occurred while creating new super admin account: ${err}`)
  }

  try {
    await trx.commit()
  } catch (err) {
    throw new Error(`Transaction commit error occurred while creating new super admin account: ${err}`)
  }

  return user
}

module.exports = {
  createSuperAdminAccount,
}
