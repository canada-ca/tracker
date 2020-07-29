const DataLoader = require('dataloader')

const batchUsersByUserName = async ([{ userNames, query }]) => {
  let cursor, users

  try {
    cursor = await query`
            FOR user IN users
                FILTER user.userName IN ${userNames}
                RETURN user
        `
  } catch (err) {
    console.error(
      `Database error occurred when running batchUsersByUserName: ${err}`,
    )
    throw new Error('Unable to find user, please try again.')
  }

  try {
    users = await cursor.all()
  } catch (err) {
    console.error(
      `Database error occurred when gathering users from cursor in batchUsersByUserName: ${err}`,
    )
    throw new Error('Unable to find user, please try again.')
  }

  const userMap = {}
  users.forEach((u) => {
    userMap[u.userName] = u
  })

  return userNames.map((userName) => userMap[userName])
}

module.exports = {
  userLoaderByUserName: () => new DataLoader(batchUsersByUserName),
}
