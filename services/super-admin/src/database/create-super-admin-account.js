const {
  SA_USER_USERNAME,
  SA_USER_PASSWORD,
  SA_USER_DISPLAY_NAME,
  SA_USER_LANG,
} = process.env

const createSuperAdminAccount = async ({ collections, bcrypt }) => {
  const password = bcrypt.hashSync(SA_USER_PASSWORD, 10)

  let user
  try {
    user = await collections.users.save({
      displayName: SA_USER_DISPLAY_NAME,
      userName: SA_USER_USERNAME,
      password,
      preferredLang: SA_USER_LANG,
      tfaValidated: false,
      emailValidated: false,
      failedLoginAttempts: 0,
    })
  } catch (err) {
    throw new Error(
      `Database error occurred while creating new super admin account: ${err}`,
    )
  }

  return user
}

module.exports = {
  createSuperAdminAccount,
}
