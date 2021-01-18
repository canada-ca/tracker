import DataLoader from 'dataloader'
import { t } from '@lingui/macro'

export const userLoaderByKey = (query, userKey, i18n) =>
  new DataLoader(async (ids) => {
    let cursor

    try {
      cursor = await query`
        FOR user IN users
          FILTER user._key IN ${ids}
          RETURN MERGE({ id: user._key, _type: "user" }, user)
      `
    } catch (err) {
      console.error(
        `Database error occurred when user: ${userKey} running userLoaderByKey: ${err}`,
      )
      throw new Error(i18n._(t`Unable to find user. Please try again.`))
    }

    const userMap = {}
    try {
      await cursor.each((user) => {
        userMap[user._key] = user
      })
    } catch (err) {
      console.error(
        `Cursor error occurred when user: ${userKey} funning userLoaderByKey: ${err}`,
      )
      throw new Error(i18n._(t`Unable to find user. Please try again.`))
    }

    return ids.map((id) => userMap[id])
  })
