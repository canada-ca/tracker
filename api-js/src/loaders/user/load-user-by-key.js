const DataLoader = require('dataloader')
const { t } = require('@lingui/macro')

module.exports.userLoaderByKey = (query, i18n) =>
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
        `Database error occurred when running userLoaderByKey: ${err}`,
      )
      throw new Error(i18n._(t`Unable to find user. Please try again.`))
    }

    const userMap = {}
    try {
      await cursor.each((user) => {
        userMap[user._key] = user
      })
    } catch (err) {
      console.error(`Cursor error occurred during userLoaderByKey: ${err}`)
      throw new Error(i18n._(t`Unable to find user. Please try again.`))
    }

    return ids.map((id) => userMap[id])
  })
