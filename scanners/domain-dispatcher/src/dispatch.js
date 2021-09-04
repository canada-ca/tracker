export async function dispatch({ cursor, publish, logger }) {
  let count = 0
  // iterate over the cursor
  for await (const batch of cursor.batches) {
    // publish each domain in the batch
    for (const domain of batch) {
      logger.info({ domain: domain.domain })
      count++
      publish({
        channel: `domains.${domain._key}`,
        msg: {
          domain: domain.domain,
          domain_key: domain._key,
          selectors: domain.selectors ? domain.selectors : [],
          user_key: null, // only used for One Time Scans
          shared_id: null, // only used for One Time Scans
        },
      })
    }
  }
  return count
}
