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

    const userMap = {}
    try {
      await cursor.each((user) => {
        userMap[user.userName] = user
      })
    } catch (err) {
      console.error(
        `Cursor error occurred during batchUsersByUserName: ${err}`,
      )
      throw new Error('Unable to find user, please try again.')
    }

    return userNames.map((userName) => userMap[userName])
  })
