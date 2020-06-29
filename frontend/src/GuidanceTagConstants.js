export const dmarc = {
  dmarc1: {
    tag_name: 'DMARC-GC',
    guidance: 'Government of Canada domains subject to TBS guidelines',
    ref_links: 'IT PIN',
    ref_links_tech: '',
  },
  dmarc2: {
    tag_name: 'DMARC-missing',
    guidance: 'Follow implementation guide',
    ref_links: 'A.2.3 Deploy Initial DMARC record',
    ref_links_tech: '',
  },
  dmarc3: {
    tag_name: 'P-missing',
    guidance: 'Follow implementation guide',
    ref_links: 'A.2.3 Deploy Initial DMARC record',
    ref_links_tech: '',
  },
  dmarc4: {
    tag_name: 'P-none',
    guidance: 'Follow implementation guide',
    ref_links: 'A.3.5 Monitor DMARC Reports and Correct Misconfigurations',
    ref_links_tech: 'RFC 6.3 General Record Format, P',
  },
  dmarc5: {
    tag_name: 'P-quarantine',
    guidance: 'Follow implementation guide',
    ref_links: 'A.4 Enforce',
    ref_links_tech: 'RFC 6.3 General Record Format, P',
  },
  dmarc6: {
    tag_name: 'P-reject',
    guidance: 'Maintain deployment',
    ref_links: 'A.5 Maintain',
    ref_links_tech: 'RFC 6.3 General Record Format, P',
  },
  dmarc7: {
    tag_name: 'PCT-100',
    guidance: 'Policy applies to all of mailflow',
    ref_links: 'B.3.1 DMARC Records',
    ref_links_tech: 'RFC 6.3 General Record Format, PCT',
  },
  dmarc8: {
    tag_name: 'PCT-xx',
    guidance: 'Policy applies to percentage of mailflow',
    ref_links: 'TBD',
    ref_links_tech: 'RFC 6.3 General Record Format, PCT',
  },
  dmarc9: {
    tag_name: 'PCT-invalid',
    guidance: 'Invalid percent',
    ref_links: 'B.3.1 DMARC Records',
    ref_links_tech: 'RFC 6.3 General Record Format, PCT',
  },
  dmarc10: {
    tag_name: 'RUA-CCCS',
    guidance: 'CCCS added to Aggregate sender list',
    ref_links: 'B.3.1 DMARC Records',
    ref_links_tech: '',
  },
  dmarc11: {
    tag_name: 'RUF-CCCS',
    guidance: 'CCCS added to Forensic sender list',
    ref_links: 'TBD',
    ref_links_tech: '',
  },
  dmarc12: {
    tag_name: 'RUA-none',
    guidance: 'No RUAs defined',
    ref_links:
      'Owner has not configured Aggregate reporting. A.2.3 Deploy Initial DMARC record',
    ref_links_tech: 'RFC 6.3 General Record Format, RUA',
  },
  dmarc13: {
    tag_name: 'RUF-none',
    guidance: 'No RUFs defined',
    ref_links:
      'Owner has not configured Forensic reporting. Missing from guide- need v1.1',
    ref_links_tech: 'RFC 6.3 General Record Format, RUF',
  },
  dmarc14: {
    tag_name: 'TXT-DMARC-enabled',
    guidance: 'Verification TXT records for all 3rd party senders exist',
    ref_links: 'TBD',
    ref_links_tech: '',
  },
  dmarc15: {
    tag_name: 'TXT-DMARC-missing',
    guidance: 'Verification TXT records for some/all 3rd party senders missing',
    ref_links: 'Contact 3rd party',
    ref_links_tech: 'RFC 7.1 Verifying External Destinations',
  },
  dmarc16: {
    tag_name: 'SP-missing',
    guidance: 'Follow implementation guide',
    ref_links: 'A.2.3 Deploy Initial DMARC Record',
    ref_links_tech: '',
  },
  dmarc17: {
    tag_name: 'SP-none',
    guidance: 'Follow implementation guide',
    ref_links: 'A3.5 Monitor DMARC Reports and Correct Misconfigurations',
    ref_links_tech: 'RFC 6.3 General Record Format, SP',
  },
  dmarc18: {
    tag_name: 'SP-quarantine',
    guidance: 'Follow implementation guide',
    ref_links: 'A.4 Enforce',
    ref_links_tech: 'RFC 6.3 General Record Format, SP',
  },
  dmarc19: {
    tag_name: 'SP-reject',
    guidance: 'Maintain deployment',
    ref_links: 'A.5 Maintain',
    ref_links_tech: 'RFC 6.3 General Record Format, SP',
  },
  dmarc20: {
    tag_name: 'PCT-none-exists',
    guidance: 'PCT should be 100, or not included, if p=none',
    ref_links: 'link',
    ref_links_tech: 'RFC 6.3 General Record Format, PCT',
  },
  dmarc21: {
    tag_name: 'PCT-0',
    guidance: 'Policy applies to no part of mailflow - irregular config',
    ref_links: 'B.3.1 DMARC Records',
    ref_links_tech:
      "pct=0 will use the next lower level of enforcement and may result in irregular mail flow if parsed incorrectly (p=quarantine; pct=0 should be 'none' but mail agents may process messages based on Quarantine)",
  },
  dmarc22: {
    tag_name: 'CNAME-DMARC',
    guidance: 'Domain uses potentially-outsourced DMARC service',
    ref_links: 'link',
    ref_links_tech: 'RFC 7.1 Verifying External Destinations',
  },
}

export const spf = {
  spf1: {
    tag_name: 'SPF-GC',
    guidance: 'Government of Canada domains subject to TBS guidelines',
    ref_links: 'IT PIN',
  },
  spf2: {
    tag_name: 'SPF-missing',
    guidance: 'Follow implementation guide',
    ref_links: 'link',
  },
  spf3: {
    tag_name: 'SPF-bad-path',
    guidance:
      'SPF implemented on incorrect subdomain. Incorrect TXT lookup found (Expected DKIM/DMARC. Found SPF)',
    ref_links: 'link',
  },
  spf4: {
    tag_name: 'ALL-missing',
    guidance: 'Follow implementation guide',
    ref_links: 'link',
  },
  spf5: {
    tag_name: 'ALL-allow',
    guidance: 'Follow implementation guide',
    ref_links: 'link',
  },
  spf6: {
    tag_name: 'ALL-neutral',
    guidance: 'Follow implementation guide',
    ref_links: 'link',
  },
  spf7: {
    tag_name: 'ALL-softfail',
    guidance: 'Maintain deployment',
    ref_links: 'link',
  },
  spf8: {
    tag_name: 'ALL-hardfail',
    guidance: 'Maintain deployment',
    ref_links: 'link',
  },
  spf9: {
    tag_name: 'ALL-redirect',
    guidance: 'Uses redirect tag with All',
    ref_links: 'link',
  },
  spf10: {
    tag_name: 'ALL-invalid',
    guidance:
      '"All" modifier included, but not in the final position. Follow implementation guide',
    ref_links: 'link',
  },
  spf11: {
    tag_name: 'A-all',
    guidance: 'SPF record specifies no host (a:). Follow implementation guide',
    ref_links: 'link',
  },
  spf12: {
    tag_name: 'INCLUDE-limit',
    guidance: 'More than 10 lookups - Follow implementation guide',
    ref_links: 'link',
  },
  spf13: {
    tag_name: 'INCLUDE-missing',
    guidance:
      'One or more included subdomain SPF records missing - Follow implementation guide',
    ref_links: 'link',
  },
}

export const dkim = {
  dkim1: {
    tag_name: 'DKIM-GC',
    guidance: 'Government of Canada domains subject to TBS guidelines',
    ref_links: 'IT PIN',
  },
  dkim2: {
    tag_name: 'DKIM-missing',
    guidance: 'Follow implementation guide',
    ref_links: 'link',
  },
  dkim3: {
    tag_name: 'DKIM-missing-mx-O365',
    guidance:
      'DKIM record missing but MX uses O365. Follow cloud-specific guidance',
    ref_links: 'link',
  },
  dkim4: {
    tag_name: 'DKIM-missing-O365-misconfigured',
    guidance:
      'DKIM CNAMEs do not exist, but MX points to *.onmicrosoft.com and SPF record includes O365.',
    ref_links: 'link',
  },
  dkim5: {
    tag_name: 'P-sub1024',
    guidance: 'Public key RSA and key length <1024',
    ref_links: 'link',
  },
  dkim6: {
    tag_name: 'P-1024',
    guidance: 'Public key RSA and key length 1024',
    ref_links: 'link',
  },
  dkim7: {
    tag_name: 'P-2048',
    guidance: 'Public key RSA and key length 2048',
    ref_links: 'link',
  },
  dkim8: {
    tag_name: 'P-4096',
    guidance: 'Public key RSA and key length 4096 or higher',
    ref_links: 'link',
  },
  dkim9: {
    tag_name: 'P-invalid',
    guidance: 'Invalid public key',
    ref_links: 'link',
  },
  dkim10: {
    tag_name: 'P-update-recommended',
    guidance: 'Public key in use for longer than 1 year',
    ref_links: 'link',
  },
  dkim11: {
    tag_name: 'DKIM-invalid-crypto',
    guidance: 'DKIM key does not use RSA',
    ref_links: 'link',
  },
  dkim12: {
    tag_name: 'DKIM-value-invalid',
    guidance: 'DKIM TXT record invalid',
    ref_links: 'link',
  },
  dkim13: {
    tag_name: 'T-enabled',
    guidance: 'Testing enabled',
    ref_links: 'link',
  },
}

export const ssl = {
  ssl1: {
    tag_name: 'SSL-GC',
    guidance: 'Government of Canada domains subject to TBS guidelines',
    ref_links: 'IT PIN',
  },
  ssl2: {
    tag_name: 'SSL-missing',
    guidance: 'Follow implementation guide',
    ref_links: 'link',
  },
  ssl3: {
    tag_name: 'SSL-rc4',
    guidance:
      'Accepted cipher list contains RC4 stream cipher, as prohibited by BOD 18-01',
    ref_links: 'link',
  },
  ssl4: {
    tag_name: 'SSL-3des',
    guidance:
      'Accepted cipher list contains 3DES symmetric-key block cipher, as prohibited by BOD 18-01',
    ref_links: 'link',
  },
  ssl5: {
    tag_name: 'SSL-acceptable-certificate',
    guidance: 'Certificate chain signed using SHA-256/SHA-384/AEAD',
    ref_links: 'link',
  },
  ssl6: {
    tag_name: 'SSL-invalid-cipher',
    guidance: 'One or more ciphers in use are not compliant with guidelines',
    ref_links: 'link',
  },
  ssl7: {
    tag_name: 'Vulnerability-heartbleed',
    guidance: 'Vulnerable to Heartbleed bug',
    ref_links: 'link',
  },
  ssl8: {
    tag_name: 'Vulnerability-ccs-injection',
    guidance: 'Vulnerable to OpenSSL CCS Injection',
    ref_links: 'link',
  },
}

export const https = {
  https1: {
    tag_name: 'HTTPS-GC',
    guidance: 'Government of Canada domains subject to TBS guidelines',
    ref_links: 'IT PIN',
  },
  https2: {
    tag_name: 'HTTPS-missing',
    guidance: 'Follow implementation guide',
    ref_links: 'link',
  },
  https3: {
    tag_name: 'HTTPS-downgraded',
    guidance:
      'Canonical HTTPS endpoint internally redirects to HTTP. Follow guidance.',
    ref_links: 'link',
  },
  https4: {
    tag_name: 'HTTPS-bad-chain',
    guidance: 'HTTPS certificate chain is invalid',
    ref_links: 'link',
  },
  https5: {
    tag_name: 'HTTPS-bad-hostname',
    guidance: 'HTTPS endpoint failed hostname validation',
    ref_links: 'link',
  },
  https6: {
    tag_name: 'HTTPS-not-enforced',
    guidance: 'Domain does not enforce HTTPS',
    ref_links: 'link',
  },
  https7: {
    tag_name: 'HTTPS-weakly-enforced',
    guidance: 'Domain does not default to HTTPS',
    ref_links: 'link',
  },
  https8: {
    tag_name: 'HTTPS-moderately-enforced',
    guidance: 'Domain defaults to HTTPS, but eventually redirects to HTTP',
    ref_links: 'link',
  },
  https9: {
    tag_name: 'HSTS-missing',
    guidance: 'HTTP Strict Transport Security (HSTS) not implemented',
    ref_links: 'link',
  },
  https10: {
    tag_name: 'HSTS-short-age',
    guidance:
      'HTTP Strict Transport Security (HSTS) policy maximum age is shorter than one year',
    ref_links: 'link',
  },
  https11: {
    tag_name: 'HSTS-preload-ready',
    guidance: 'Domain not pre-loaded by HSTS, but is pre-load ready',
    ref_links: 'link',
  },
  https12: {
    tag_name: 'HSTS-not-preloaded',
    guidance: 'Domain not pre-loaded by HSTS',
    ref_links: 'link',
  },
  https13: {
    tag_name: 'HTTPS-certificate-expired',
    guidance: 'HTTPS certificate is expired',
    ref_links: 'link',
  },
  https14: {
    tag_name: 'HTTPS-certificate-self-signed',
    guidance: 'HTTPS certificate is self-signed',
    ref_links: 'link',
  },
}
