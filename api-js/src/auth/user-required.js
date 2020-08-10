const userRequired = async (userId, userLoaderById) => {
  if (typeof userId === 'undefined') {
    console.warn(
      `User attempted to access controlled content, but userId was undefined.`,
    )
    throw new Error('Authentication error. Please sign in.')
  }

  let user, userDoesNotExist
  try {
    user = await userLoaderById.load(userId)
    if (typeof user === 'undefined') {
      userDoesNotExist = true
    }
  } catch (err) {
    console.error(`Database error occurred when running userRequired: ${err}`)
    throw new Error('Authentication error. Please sign in.')
  }

  if (userDoesNotExist) {
    console.warn(
      `User: ${userId} attempted to access controlled content, but no user is associated with that id.`,
    )
    throw new Error('Authentication error. Please sign in.')
  }

  return user
}

module.exports = {
  userRequired,
}
