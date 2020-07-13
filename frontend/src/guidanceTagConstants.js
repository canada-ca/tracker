import { t } from '@lingui/macro'

const refLinksGuide = {
  a322: {
    heading: t`3.2.2 Third Parties and DKIM`,
    link: t`https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322`,
  },
  anna23: {
    heading: t`A.2.3 Deploy Initial DMARC record`,
    link: t`https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna23`,
  },
  anna33: {
    heading: t`A.3.3 Deploy SPF for All Domains`,
    link: t`https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna33`,
  },
  anna34: {
    heading: t`A.3.4 Deploy DKIM for All Domains and Senders`,
    link: t`https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34`,
  },
  anna35: {
    heading: t`A.3.5 Monitor DMARC Reports and Correct Misconfigurations`,
    link: t`https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna35`,
  },
  anna4: {
    heading: t`A.4 Enforce`,
    link: t`https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna4`,
  },
  anna5: {
    heading: t`A.5 Maintain`,
    link: t`https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna5`,
  },
  anna53: {
    heading: t`A.5.3 Rotate DKIM Keys`,
    link: t`https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna53`,
  },
  annb11: {
    heading: t`B.1.1 SPF Records`,
    link: t`https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#annb11`,
  },
  annb13: {
    heading: t`B.1.3 DNS Lookup Limit`,
    link: t`https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#annb13`,
  },
  annb21: {
    heading: t`B.2.1 DKIM Records`,
    link: t`https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#annb21`,
  },
  annb22: {
    heading: t`B.2.2 Cryptographic Considerations`,
    link: t`https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#annb22`,
  },
  annb31: {
    heading: t`B.3.1 DMARC Records`,
    link: t`https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#annb31`,
  },
}

const dmarcTechnical = {
  tech63: {
    heading: t`RFC 6.3.  General Record Format`,
    link: t`https://tools.ietf.org/html/rfc7489#section-6.3`,
  },
  tech71: {
    heading: t`RFC 7.1.  Verifying External Destinations`,
    link: t`https://tools.ietf.org/html/rfc7489#section-7.1`,
  },
}

const spfTechnical = {
  tech464: {
    heading: t`RFC 4.6.4.  DNS Lookup Limits`,
    link: t`https://tools.ietf.org/html/rfc7208#section-4.6.4`,
  },
  tech61: {
    heading: t`RFC 6.1.  redirect: Redirected Query`,
    link: t`https://tools.ietf.org/html/rfc7208#section-6.1`,
  },
}

const dkimTechnical = {
  o365: {
    heading: t`Use DKIM to validate outbound email sent from your custom domain`,
    link: t`https://docs.microsoft.com/en-ca/microsoft-365/security/office-365-security/use-dkim-to-validate-outbound-email?view=o365-worldwide`,
  },
  tech361: {
    heading: t`Textual Representation`,
    link: t`https://tools.ietf.org/html/rfc6376#section-3.6.1`,
  },
}

export const guidanceTags = {
  dmarc: {
    dmarc1: {
      tag_name: t`DMARC-GC`,
      guidance: t`Government of Canada domains subject to TBS guidelines`,
      ref_links_guide: null,
      ref_links_technical: null,
      summary: t`IT PIN`,
    },
    dmarc2: {
      tag_name: t`DMARC-missing`,
      guidance: t`Follow implementation guide`,
      ref_links_guide: refLinksGuide.anna23,
      ref_links_technical: null,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    dmarc3: {
      tag_name: t`P-missing`,
      guidance: t`Follow implementation guide`,
      ref_links_guide: refLinksGuide.anna23,
      ref_links_technical: null,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    dmarc4: {
      tag_name: t`P-none`,
      guidance: t`Follow implementation guide`,
      ref_links_guide: refLinksGuide.anna35,
      ref_links_technical: dmarcTechnical.tech63,
      ref_links_technical_subheading: t`P`,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    dmarc5: {
      tag_name: t`P-quarantine`,
      guidance: t`Follow implementation guide`,
      ref_links_guide: refLinksGuide.anna4,
      ref_links_technical: dmarcTechnical.tech63,
      ref_links_technical_subheading: t`P`,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    dmarc6: {
      tag_name: t`P-reject`,
      guidance: t`Maintain deployment`,
      ref_links_guide: refLinksGuide.anna5,
      ref_links_technical: dmarcTechnical.tech63,
      ref_links_technical_subheading: t`P`,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    dmarc7: {
      tag_name: t`PCT-100`,
      guidance: t`Policy applies to all of mailflow`,
      ref_links_guide: refLinksGuide.annb31,
      ref_links_technical: dmarcTechnical.tech63,
      ref_links_technical_subheading: t`PCT`,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    dmarc8: {
      tag_name: t`PCT-xx`,
      guidance: t`Policy applies to percentage of mailflow`,
      ref_links_guide: null,
      ref_links_technical: dmarcTechnical.tech63,
      ref_links_technical_subheading: t`PCT`,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    dmarc9: {
      tag_name: t`PCT-invalid`,
      guidance: t`Invalid percent`,
      ref_links_guide: refLinksGuide.annb31,
      ref_links_technical: dmarcTechnical.tech63,
      ref_links_technical_subheading: t`PCT`,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    dmarc10: {
      tag_name: t`RUA-CCCS`,
      guidance: t`CCCS added to Aggregate sender list`,
      ref_links_guide: refLinksGuide.annb31,
      ref_links_technical: null,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    dmarc11: {
      tag_name: t`RUF-CCCS`,
      guidance: t`CCCS added to Forensic sender list`,
      ref_links_guide: null,
      ref_links_technical: null,
      summary: t`Missing from guide- need v1.1`,
    },
    dmarc12: {
      tag_name: t`RUA-none`,
      guidance: t`No RUAs defined`,
      ref_links_guide: refLinksGuide.anna23,
      ref_links_technical: dmarcTechnical.tech63,
      ref_links_technical_subheading: t`RUA`,
      summary: t`Owner has not configured Aggregate reporting. `,
    },
    dmarc13: {
      tag_name: t`RUF-none`,
      guidance: t`No RUFs defined`,
      ref_links_guide: null,
      ref_links_technical: dmarcTechnical.tech63,
      ref_links_technical_subheading: t`RUF`,
      summary: t`Owner has not configured Forensic reporting. Missing from guide- need v1.1`,
    },
    dmarc14: {
      tag_name: t`TXT-DMARC-enabled`,
      guidance: t`Verification TXT records for all 3rd party senders exist`,
      ref_links_guide: null,
      ref_links_technical: null,
      summary: t`TBD`,
    },
    dmarc15: {
      tag_name: t`TXT-DMARC-missing`,
      guidance: t`Verification TXT records for some/all 3rd party senders missing`,
      ref_links_guide: null,
      ref_links_technical: dmarcTechnical.tech71,
      summary: t`Contact 3rd party`,
    },
    dmarc16: {
      tag_name: t`SP-missing`,
      guidance: t`Follow implementation guide`,
      ref_links_guide: refLinksGuide.anna23,
      ref_links_technical: null,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    dmarc17: {
      tag_name: t`SP-none`,
      guidance: t`Follow implementation guide`,
      ref_links_guide: refLinksGuide.anna35,
      ref_links_technical: dmarcTechnical.tech63,
      ref_links_technical_subheading: t`SP`,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    dmarc18: {
      tag_name: t`SP-quarantine`,
      guidance: t`Follow implementation guide`,
      ref_links_guide: refLinksGuide.anna4,
      ref_links_technical: dmarcTechnical.tech63,
      ref_links_technical_subheading: t`SP`,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    dmarc19: {
      tag_name: t`SP-reject`,
      guidance: t`Maintain deployment`,
      ref_links_guide: refLinksGuide.anna5,
      ref_links_technical: dmarcTechnical.tech63,
      ref_links_technical_subheading: t`SP`,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    dmarc20: {
      tag_name: t`PCT-none-exists`,
      guidance: t`PCT should be 100, or not included, if p=none`,
      ref_links_guide: null,
      ref_links_technical: dmarcTechnical.tech63,
      ref_links_technical_subheading: t`PCT`,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    dmarc21: {
      tag_name: t`PCT-0`,
      guidance: t`Policy applies to no part of mailflow - irregular config`,
      ref_links_guide: refLinksGuide.annb31,
      ref_links_technical: null,
      summary: t`pct=0 will use the next lower level of enforcement and may result in irregular mail flow if parsed incorrectly (p=quarantine; pct=0 should be t\`none\` but mail agents may process messages based on Quarantine)`,
    },
    dmarc22: {
      tag_name: t`CNAME-DMARC`,
      guidance: t`Domain uses potentially-outsourced DMARC service`,
      ref_links_guide: null,
      ref_links_technical: dmarcTechnical.tech71,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
  },

  spf: {
    spf1: {
      tag_name: t`SPF-GC`,
      guidance: t`Government of Canada domains subject to TBS guidelines`,
      ref_links_guide: null,
      ref_links_technical: null,
      summary: t`IT PIN. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    spf2: {
      tag_name: t`SPF-missing`,
      guidance: t`Follow implementation guide`,
      ref_links_guide: refLinksGuide.anna33,
      ref_links_technical: null,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    spf3: {
      tag_name: t`SPF-bad-path`,
      guidance: t`SPF implemented in incorrect subdomain`,
      ref_links_guide: refLinksGuide.annb11,
      ref_links_technical: null,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    spf4: {
      tag_name: t`ALL-missing`,
      guidance: t`Follow implementation guide`,
      ref_links_guide: refLinksGuide.annb11,
      ref_links_technical: null,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    spf5: {
      tag_name: t`ALL-allow`,
      guidance: t`Follow implementation guide`,
      ref_links_guide: refLinksGuide.annb11,
      ref_links_technical: null,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    spf6: {
      tag_name: t`ALL-neutral`,
      guidance: t`Follow implementation guide`,
      ref_links_guide: refLinksGuide.annb11,
      ref_links_technical: null,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    spf7: {
      tag_name: t`ALL-softfail`,
      guidance: t`Maintain deployment`,
      ref_links_guide: refLinksGuide.annb11,
      ref_links_technical: null,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    spf8: {
      tag_name: t`ALL-hardfail`,
      guidance: t`Maintain deployment`,
      ref_links_guide: refLinksGuide.annb11,
      ref_links_technical: null,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    spf9: {
      tag_name: t`ALL-redirect`,
      guidance: t`Uses redirect tag with All`,
      ref_links_guide: null,
      ref_links_technical: spfTechnical.tech61,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    spf10: {
      tag_name: t`A-all`,
      guidance: t`Follow implementation guide`,
      ref_links_guide: refLinksGuide.annb11,
      ref_links_technical: null,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    spf11: {
      tag_name: t`INCLUDE-limit`,
      guidance: t`More than 10 lookups - Follow implementation guide`,
      ref_links_guide: refLinksGuide.annb13,
      ref_links_technical: spfTechnical.tech464,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
  },

  dkim: {
    dkim1: {
      tag_name: t`DKIM-GC`,
      guidance: t`Government of Canada domains subject to TBS guidelines`,
      ref_links_guide: null,
      ref_links_technical: null,
      summary: t`IT PIN. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    dkim2: {
      tag_name: t`DKIM-missing`,
      guidance: t`Follow implementation guide`,
      ref_links_guide: refLinksGuide.anna34,
      ref_links_technical: null,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    dkim3: {
      tag_name: t`DKIM-missing-mx-O365`,
      guidance: t`DKIM record missing but MX uses O365. Follow cloud-specific guidance`,
      ref_links_guide: refLinksGuide.a322,
      ref_links_technical: dkimTechnical.o365,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    dkim4: {
      tag_name: t`DKIM-missing-O365-misconfigured`,
      guidance: t`DKIM CNAMEs do not exist, but MX points to *.onmicrosoft.com and SPF record includes O365.`,
      ref_links_guide: refLinksGuide.a322,
      ref_links_technical: dkimTechnical.o365,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    dkim5: {
      tag_name: t`P-sub1024`,
      guidance: t`Public key RSA and key length <1024`,
      ref_links_guide: refLinksGuide.annb22,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    dkim6: {
      tag_name: t`P-1024`,
      guidance: t`Public key RSA and key length 1024`,
      ref_links_guide: refLinksGuide.annb22,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    dkim7: {
      tag_name: t`P-2048`,
      guidance: t`Public key RSA and key length 2048`,
      ref_links_guide: refLinksGuide.annb22,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    dkim8: {
      tag_name: t`P-4096`,
      guidance: t`Public key RSA and key length 4096 or higher`,
      ref_links_guide: refLinksGuide.annb22,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    dkim9: {
      tag_name: t`P-invalid`,
      guidance: t`Invalid public key`,
      ref_links_guide: refLinksGuide.annb21,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    dkim10: {
      tag_name: t`P-update-recommended`,
      guidance: t`Public key in use for longer than 1 year`,
      ref_links_guide: refLinksGuide.anna53,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    dkim11: {
      tag_name: t`DKIM-invalid-crypto`,
      guidance: t`DKIM key does not use RSA`,
      ref_links_guide: refLinksGuide.annb22,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    dkim12: {
      tag_name: t`DKIM-value-invalid`,
      guidance: t`DKIM TXT record invalid`,
      ref_links_guide: refLinksGuide.annb21,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    dkim13: {
      tag_name: t`T-enabled`,
      guidance: t`As per RFC section 3.6.1, Testing flag t=y means Verifiers MUST treat messages as unsigned (i.e. DKIM is not enabled), so this flag should not be enabled.`,
      ref_links_guide: null,
      ref_links_technical: dkimTechnical.tech361,
      summary: t`DKIM Flag t`,
    },
  },

  ssl: {
    ssl1: {
      tag_name: t`SSL-GC`,
      guidance: t`Government of Canada domains subject to TBS guidelines`,
      ref_links_guide: null,
      summary: t`IT PIN. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    ssl2: {
      tag_name: t`SSL-missing`,
      guidance: t`Follow implementation guide`,
      ref_links_guide: null,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    ssl3: {
      tag_name: t`SSL-rc4`,
      guidance: t`Accepted cipher list contains RC4 stream cipher, as prohibited by BOD 18-01`,
      ref_links_guide: null,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    ssl4: {
      tag_name: t`SSL-3des`,
      guidance: t`Accepted cipher list contains 3DES symmetric-key block cipher, as prohibited by BOD 18-01`,
      ref_links_guide: null,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    ssl5: {
      tag_name: t`SSL-acceptable-certificate`,
      guidance: t`Certificate chain signed using SHA-256/SHA-384/AEAD`,
      ref_links_guide: null,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    ssl6: {
      tag_name: t`SSL-invalid-cipher`,
      guidance: t`One or more ciphers in use are not compliant with guidelines`,
      ref_links_guide: null,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    ssl7: {
      tag_name: t`Vulnerability-heartbleed`,
      guidance: t`Vulnerable to Heartbleed bug`,
      ref_links_guide: null,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    ssl8: {
      tag_name: t`Vulnerability-ccs-injection`,
      guidance: t`Vulnerable to OpenSSL CCS Injection`,
      ref_links_guide: null,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
  },

  https: {
    https1: {
      tag_name: t`HTTPS-GC`,
      guidance: t`Government of Canada domains subject to TBS guidelines`,
      ref_links_guide: null,
      summary: t`IT PIN. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    https2: {
      tag_name: t`HTTPS-missing`,
      guidance: t`Follow implementation guide`,
      ref_links_guide: null,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    https3: {
      tag_name: t`HTTPS-downgraded`,
      guidance: t`Canonical HTTPS endpoint internally redirects to HTTP. Follow guidance.`,
      ref_links_guide: null,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    https4: {
      tag_name: t`HTTPS-bad-chain`,
      guidance: t`HTTPS certificate chain is invalid`,
      ref_links_guide: null,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    https5: {
      tag_name: t`HTTPS-bad-hostname`,
      guidance: t`HTTPS endpoint failed hostname validation`,
      ref_links_guide: null,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    https6: {
      tag_name: t`HTTPS-not-enforced`,
      guidance: t`Domain does not enforce HTTPS`,
      ref_links_guide: null,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    https7: {
      tag_name: t`HTTPS-weakly-enforced`,
      guidance: t`Domain does not default to HTTPS`,
      ref_links_guide: null,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    https8: {
      tag_name: t`HTTPS-moderately-enforced`,
      guidance: t`Domain defaults to HTTPS, but eventually redirects to HTTP`,
      ref_links_guide: null,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    https9: {
      tag_name: t`HSTS-missing`,
      guidance: t`HTTP Strict Transport Security (HSTS) not implemented`,
      ref_links_guide: null,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    https10: {
      tag_name: t`HSTS-short-age`,
      guidance: t`HTTP Strict Transport Security (HSTS) policy maximum age is shorter than one year`,
      ref_links_guide: null,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    https11: {
      tag_name: t`HSTS-preload-ready`,
      guidance: t`Domain not pre-loaded by HSTS, but is pre-load ready`,
      ref_links_guide: null,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    https12: {
      tag_name: t`HSTS-not-preloaded`,
      guidance: t`Domain not pre-loaded by HSTS`,
      ref_links_guide: null,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    https13: {
      tag_name: t`HTTPS-certificate-expired`,
      guidance: t`HTTPS certificate is expired`,
      ref_links_guide: null,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
    https14: {
      tag_name: t`HTTPS-certificate-self-signed`,
      guidance: t`HTTPS certificate is self-signed`,
      ref_links_guide: null,
      summary: t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.`,
    },
  },
}
