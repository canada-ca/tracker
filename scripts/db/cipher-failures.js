/*
 * This script prints a list of all the ciphers we are marking as weak (and
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
          LET latest = (FOR e IN grouped[*].edge SORT e.timestamp DESC LIMIT 1 RETURN e)
          RETURN latest
    )
    LET domains = COUNT(domains)
    LET results = (FOR result IN FLATTEN(latestscans, 2) RETURN DOCUMENT(result._to))
    LET bad_ciphers = [
              "TLS_RSA_WITH_AES_256_GCM_SHA384",
              "TLS_RSA_WITH_AES_128_GCM_SHA256",
              "TLS_RSA_WITH_AES_256_CBC_SHA256",
              "TLS_RSA_WITH_AES_256_CBC_SHA",
              "TLS_RSA_WITH_AES_128_CBC_SHA256",
              "TLS_RSA_WITH_AES_128_CBC_SHA",
              "TLS_ECDHE_ECDSA_WITH_3DES_EDE_CBC_SHA",
              "TLS_ECDHE_RSA_WITH_3DES_EDE_CBC_SHA",
              "TLS_DHE_RSA_WITH_3DES_EDE_CBC_SHA",
              "TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA",
              "TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA",
              "TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA",
              "TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA",
              "TLS_DHE_RSA_WITH_AES_256_CBC_SHA",
              "TLS_DHE_RSA_WITH_AES_128_CBC_SHA"
    ]
    FOR v IN results
      FILTER v.weak_ciphers != []
      FOR cipher IN v.weak_ciphers
        COLLECT weak_cipher = cipher WITH COUNT INTO count
        SORT count DESC
        FILTER weak_cipher NOT IN bad_ciphers
        RETURN {weak_cipher, count, percentage: count/domains * 100}
  `
  )
  .toArray();

console.log({ results });
