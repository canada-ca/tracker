/*
 * This script prints a list of all the curves we are marking as weak (and
 * therefor failing people for) that are *not* on the Cybercentre's naughty list:
 * https://github.com/CybercentreCanada/ITSP.40.062/blob/main/transport-layer-security/tls-guidance.json
 *
 * N.B.:This script assumes that remove-orphans.js and add-timestamps.js have been
 * run on the data.
 */
db._useDatabase("track_dmarc");

let results = db
  ._query(
    aql`
    LET latestscans = (
      FOR edge IN domainsSSL
          COLLECT from = edge._from INTO grouped
          LET latest = (FOR e IN grouped[*].edge SORT e.timestamp DESC LIMIT 1
            RETURN e)
          RETURN latest
    )
    LET domains = COUNT(domains)
    LET results = (FOR result IN FLATTEN(latestscans, 2) RETURN
      DOCUMENT(result._to))
    LET bad_curves = [
            "secp224r1",
            "sect233r1",
            "sect233k1",
            "ffdhe2048"
    ]
    FOR v IN results
      FILTER v.weak_curves != []
      FOR curve IN v.weak_curves
        COLLECT weak_curve = curve WITH COUNT INTO count
        SORT count DESC
        FILTER weak_curve NOT IN bad_curves
        RETURN {weak_curve, count, percentage: count/domains * 100}

  `
  )
  .toArray();

console.log({ results });
