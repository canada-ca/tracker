import { aql } from 'arangojs'

export async function getCursor({ db, collection }) {
  const cursor = await db.query(
    aql`
    FOR domain IN ${collection}
      LET rcodeEnum = domain.rcode == 'NOERROR' ? 1 : 0
      SORT rcodeEnum DESC
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
