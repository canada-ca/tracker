import { aql } from 'arangojs'

export async function getCursor({ db, collection }) {
  const cursor = await db.query(
    aql`
    FOR document IN ${collection}
        RETURN document
  `,
    {
      count: true,
      ttl: 120, // Time To Live for the cursor
      batchSize: 100,
    },
  )
  return cursor
}
