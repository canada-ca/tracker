import DataLoader from 'dataloader'
import { t } from '@lingui/macro'

export const userLoaderByUserName = (query, userKey, i18n) =>
  new DataLoader(async (userNames) => {
    let cursor

    try {
      cursor = await query`
        FOR user IN users
          FILTER user.userName IN ${userNames}
          RETURN MERGE({ id: user._key, _type: "user" }, user)
      `
    } catch (err) {
      console.error(
        `Database error occurred when user: ${userKey} running userLoaderByUserName: ${err}`,
      )
      throw new Error(i18n._(t`Unable to find user. Please try again.`))
    }

    const userMap = {}
    try {
      await cursor.each((user) => {
        userMap[user.userName] = user
      })
    } catch (err) {
      console.error(
        `Cursor error occurred when user: ${userKey} running userLoaderByUserName: ${err}`,
      )
      throw new Error(i18n._(t`Unable to find user. Please try again.`))
    }

    return userNames.map((userName) => userMap[userName])
  })
