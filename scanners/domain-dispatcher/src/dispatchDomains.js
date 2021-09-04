import { getCursor } from './getCursor.js'
import { dispatch } from './dispatch.js'

export async function dispatchDomains({
  db,
  collection = 'domains',
  publish,
  logger,
}) {
  const col = db.collection(collection)

  const cursor = await getCursor({ db, collection: col })

  return dispatch({ cursor, publish, logger })
}
