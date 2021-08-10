import DataLoader from 'dataloader'
import { t } from '@lingui/macro'

export const loadUserByKey = ({ query, userKey, i18n }) =>
  new DataLoader(async (ids) => {
    let cursor

    try {
      cursor = await query`
        WITH users
        FOR user IN users
          FILTER user._key IN ${ids}
          RETURN MERGE({ id: user._key, _type: "user" }, user)
      `
    } catch (err) {
      console.error(
        `Database error occurred when user: ${userKey} running loadUserByKey: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load user(s). Please try again.`))
    }

    const userMap = {}
    try {
      await cursor.forEach((user) => {
        userMap[user._key] = user
      })
    } catch (err) {
      console.error(
        `Cursor error occurred when user: ${userKey} running loadUserByKey: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load user(s). Please try again.`))
    }

    return ids.map((id) => userMap[id])
  })
