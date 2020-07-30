const DataLoader = require('dataloader')

module.exports.userLoaderByUserName = (query) =>
  new DataLoader(async (userNames) => {
    let cursor

    try {
      cursor = await query`
              FOR user IN users
                  FILTER ${userNames}[** FILTER CURRENT == user.userName]
                  RETURN user
          `
    } catch (err) {
      console.error(
        `Database error occurred when running batchUsersByUserName: ${err}`,
      )
      throw new Error('Unable to find user, please try again.')
    }

    let user
    const userMap = {}
    while (cursor.hasNext()) {
      try {
        user = await cursor.next()
      } catch (err) {
        console.error(
          `Cursor error occurred during batchUsersByUserName: ${err}`,
        )
        throw new Error('Unable to find user, please try again.')
      }
      userMap[user.userName] = user
    }

    return userNames.map((userName) => userMap[userName])
  })
