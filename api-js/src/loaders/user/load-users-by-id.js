const DataLoader = require('dataloader')

module.exports.userLoaderById = (query) =>
  new DataLoader(async (ids) => {
    let cursor

    try {
      cursor = await query`
        FOR user IN users
          FILTER ${ids}[** FILTER CURRENT == user._key]
          RETURN user
      `
    } catch (err) {
      console.error(
        `Database error occurred when running userLoaderById: ${err}`,
      )
      throw new Error('Unable to find user. Please try again.')
    }

    const userMap = {}
    try {
      await cursor.each((user) => {
        userMap[user._key] = user
      })
    } catch (err) {
      console.error(`Cursor error occurred during userLoaderById: ${err}`)
      throw new Error('Unable to find user. Please try again.')
    }

    return ids.map((id) => userMap[id])
  })
