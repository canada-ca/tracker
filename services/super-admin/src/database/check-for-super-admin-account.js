const { SA_USER_USERNAME } = process.env

const checkForSuperAdminAccount = async ({ query }) => {
  let cursor
  try {
    cursor = await query`
      FOR user IN users
        FILTER user.userName == ${SA_USER_USERNAME}
        RETURN user
    `
  } catch (err) {
    throw new Error(
      `Database error occurred well trying to find super admin account: ${err}`,
    )
  }

  let user
  try {
    user = await cursor.next()
  } catch (err) {
    throw new Error(
      `Cursor error occurred well trying to find super admin account: ${err}`,
    )
  }

  return user
}

module.exports = {
  checkForSuperAdminAccount,
}
