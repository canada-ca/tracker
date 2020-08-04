const DataLoader = require('dataloader')

module.exports.userLoaderById = (query) =>
  new DataLoader(async (ids) => {
    let cursor

    try {
      cursor = await query`
        FOR user IN users
          FILTER user._key IN ${ids}
          RETURN user
      `
    } catch (err) {
      console.error(
        `Database error occurred when running batchUsersByIds: ${err}`,
      )
      throw new Error('Unable to find user, please try again.')
    }

    let user
    const userMap = {}
    while (cursor.hasNext()) {
      try {
        user = await cursor.next()
      } catch (err) {
        console.error(`Cursor error occurred during batchUsersByIds: ${err}`)
        throw new Error('Unable to find user, please try again.')
      }
      userMap[user._key] = user
    }

    return ids.map((id) => userMap[id])
  })
