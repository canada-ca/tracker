console.log(db._query(`
FOR domain IN domains
  FILTER domain.domain ==  "cyber.gc.ca"
    LET dmarc = (FOR v IN ANY domain domainsDMARC RETURN v)
      LET spf = (FOR v IN ANY domain domainsSPF RETURN v)
        LET dkim = (FOR v IN ANY domain domainsDKIM RETURN v)
          RETURN {domain, dmarc, spf, dkim}
`).toArray())
