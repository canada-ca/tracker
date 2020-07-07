const refLinksGuide = {
  a322: {
    heading: '3.2.2 Third Parties and DKIM',
    link:
      'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
  },
  anna23: {
    heading: 'A.2.3 Deploy Initial DMARC record',
    link:
      'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna23',
  },
  anna33: {
    heading: 'A.3.3 Deploy SPF for All Domains',
    link:
      'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna33',
  },
  anna34: {
    heading: 'A.3.4 Deploy DKIM for All Domains and Senders',
    link:
      'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
  },
  anna35: {
    heading: "A.3.5 Monitor DMARC Reports and Correct Misconfigurations'",
    link:
      'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna35',
  },
  anna4: {
    heading: 'A.4 Enforce',
    link:
      'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna4',
  },
  anna5: {
    heading: 'A.5 Maintain',
    link:
      'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna5',
  },
  anna53: {
    heading: 'A.5.3 Rotate DKIM Keys',
    link:
      'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna53',
  },
  annb11: {
    heading: 'B.1.1 SPF Records',
    link:
      'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#annb11',
  },
  annb13: {
    heading: 'B.1.3 DNS Lookup Limit',
    link:
      'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#annb13',
  },
  annb21: {
    heading: 'B.2.1 DKIM Records',
    link:
      'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#annb21',
  },
  annb22: {
    heading: 'B.2.2 Cryptographic Considerations',
    link:
      'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#annb22',
  },
  annb31: {
    heading: 'B.3.1 DMARC Records',
    link:
      'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#annb31',
  },
}

const dmarcTechnical = {
  tech63: {
    heading: 'RFC 6.3.  General Record Format',
    link: 'https://tools.ietf.org/html/rfc7489#section-6.3',
  },
  tech71: {
    heading: 'RFC 7.1.  Verifying External Destinations',
    link: 'https://tools.ietf.org/html/rfc7489#section-7.1',
  },
}

const spfTechnical = {
  tech464: {
    heading: 'RFC 4.6.4.  DNS Lookup Limits',
    link: 'https://tools.ietf.org/html/rfc7208#section-4.6.4',
  },
  tech61: {
    heading: 'RFC 6.1.  redirect: Redirected Query',
    link: 'https://tools.ietf.org/html/rfc7208#section-6.1',
  },
}

export const guidanceTagsOld = {
  dmarc: {
    dmarc1: {
      tag_name: 'DMARC-GC',
      guidance: 'Government of Canada domains subject to TBS guidelines',
      ref_links_guide: {},
      ref_links_technical: {},
      summary: 'IT PIN',
    },
    dmarc2: {
      tag_name: 'DMARC-missing',
      guidance: 'Follow implementation guide',
      ref_links_guide: refLinksGuide.anna23,
      ref_links_technical: {},
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    dmarc3: {
      tag_name: 'P-missing',
      guidance: 'Follow implementation guide',
      ref_links_guide: refLinksGuide.anna23,
      ref_links_technical: {},
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    dmarc4: {
      tag_name: 'P-none',
      guidance: 'Follow implementation guide',
      ref_links_guide: refLinksGuide.anna35,
      ref_links_technical: dmarcTechnical.tech63,
      ref_links_technical_subheading: 'P',
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    dmarc5: {
      tag_name: 'P-quarantine',
      guidance: 'Follow implementation guide',
      ref_links_guide: refLinksGuide.anna4,
      ref_links_technical: dmarcTechnical.tech63,
      ref_links_technical_subheading: 'P',
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    dmarc6: {
      tag_name: 'P-reject',
      guidance: 'Maintain deployment',
      ref_links_guide: refLinksGuide.anna5,
      ref_links_technical: dmarcTechnical.tech63,
      ref_links_technical_subheading: 'P',
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    dmarc7: {
      tag_name: 'PCT-100',
      guidance: 'Policy applies to all of mailflow',
      ref_links_guide: refLinksGuide.annb31,
      ref_links_technical: dmarcTechnical.tech63,
      ref_links_technical_subheading: 'PCT',
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    dmarc8: {
      tag_name: 'PCT-xx',
      guidance: 'Policy applies to percentage of mailflow',
      ref_links_guide: 'TBD',
      ref_links_technical: dmarcTechnical.tech63,
      ref_links_technical_subheading: 'PCT',
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    dmarc9: {
      tag_name: 'PCT-invalid',
      guidance: 'Invalid percent',
      ref_links_guide: refLinksGuide.annb31,
      ref_links_technical: dmarcTechnical.tech63,
      ref_links_technical_subheading: 'PCT',
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    dmarc10: {
      tag_name: 'RUA-CCCS',
      guidance: 'CCCS added to Aggregate sender list',
      ref_links_guide: refLinksGuide.annb31,
      ref_links_technical: {},
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    dmarc11: {
      tag_name: 'RUF-CCCS',
      guidance: 'CCCS added to Forensic sender list',
      ref_links_guide: {},
      ref_links_technical: {},
      summary: 'Missing from guide- need v1.1',
    },
    dmarc12: {
      tag_name: 'RUA-none',
      guidance: 'No RUAs defined',
      ref_links_guide: refLinksGuide.anna23,
      ref_links_technical: dmarcTechnical.tech63,
      ref_links_technical_subheading: 'RUA',
      summary: 'Owner has not configured Aggregate reporting. ',
    },
    dmarc13: {
      tag_name: 'RUF-none',
      guidance: 'No RUFs defined',
      ref_links_guide: {},
      ref_links_technical: dmarcTechnical.tech63,
      ref_links_technical_subheading: 'RUF',
      summary:
        'Owner has not configured Forensic reporting. Missing from guide- need v1.1',
    },
    dmarc14: {
      tag_name: 'TXT-DMARC-enabled',
      guidance: 'Verification TXT records for all 3rd party senders exist',
      ref_links_guide: 'TBD',
      ref_links_technical: {},
      summary: 'TBD',
    },
    dmarc15: {
      tag_name: 'TXT-DMARC-missing',
      guidance:
        'Verification TXT records for some/all 3rd party senders missing',
      ref_links_guide: {},
      ref_links_technical: dmarcTechnical.tech71,
      summary: 'Contact 3rd party',
    },
    dmarc16: {
      tag_name: 'SP-missing',
      guidance: 'Follow implementation guide',
      ref_links_guide: refLinksGuide.anna23,
      ref_links_technical: {},
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    dmarc17: {
      tag_name: 'SP-none',
      guidance: 'Follow implementation guide',
      ref_links_guide: refLinksGuide.anna35,
      ref_links_technical: dmarcTechnical.tech63,
      ref_links_technical_subheading: 'SP',
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    dmarc18: {
      tag_name: 'SP-quarantine',
      guidance: 'Follow implementation guide',
      ref_links_guide: refLinksGuide.anna4,
      ref_links_technical: dmarcTechnical.tech63,
      ref_links_technical_subheading: 'SP',
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    dmarc19: {
      tag_name: 'SP-reject',
      guidance: 'Maintain deployment',
      ref_links_guide: refLinksGuide.anna5,
      ref_links_technical: dmarcTechnical.tech63,
      ref_links_technical_subheading: 'SP',
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    dmarc20: {
      tag_name: 'PCT-none-exists',
      guidance: 'PCT should be 100, or not included, if p=none',
      ref_links_guide: 'link',
      ref_links_technical: dmarcTechnical.tech63,
      ref_links_technical_subheading: 'PCT',
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    dmarc21: {
      tag_name: 'PCT-0',
      guidance: 'Policy applies to no part of mailflow - irregular config',
      ref_links_guide: refLinksGuide.annb31,
      ref_links_technical:
        "pct=0 will use the next lower level of enforcement and may result in irregular mail flow if parsed incorrectly (p=quarantine; pct=0 should be 'none' but mail agents may process messages based on Quarantine)",
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    dmarc22: {
      tag_name: 'CNAME-DMARC',
      guidance: 'Domain uses potentially-outsourced DMARC service',
      ref_links_guide: 'link',
      ref_links_technical: dmarcTechnical.tech71,
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
  },

  spf: {
    spf1: {
      tag_name: 'SPF-GC',
      guidance: 'Government of Canada domains subject to TBS guidelines',
      ref_links_guide: 'IT PIN',
      ref_links_technical: {},
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    spf2: {
      tag_name: 'SPF-missing',
      guidance: 'Follow implementation guide',
      ref_links_guide: refLinksGuide.anna33,

      ref_links_technical: {},
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    spf3: {
      tag_name: 'SPF-bad-path',
      guidance: 'SPF implemented in incorrect subdomain',
      ref_links_guide: refLinksGuide.annb11,

      ref_links_technical: {},
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    spf4: {
      tag_name: 'ALL-missing',
      guidance: 'Follow implementation guide',
      ref_links_guide: refLinksGuide.annb11,
      ref_links_technical: {},
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    spf5: {
      tag_name: 'ALL-allow',
      guidance: 'Follow implementation guide',
      ref_links_guide: refLinksGuide.annb11,
      ref_links_technical: {},
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    spf6: {
      tag_name: 'ALL-neutral',
      guidance: 'Follow implementation guide',
      ref_links_guide: refLinksGuide.annb11,
      ref_links_technical: {},
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    spf7: {
      tag_name: 'ALL-softfail',
      guidance: 'Maintain deployment',
      ref_links_guide: refLinksGuide.annb11,
      ref_links_technical: {},
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    spf8: {
      tag_name: 'ALL-hardfail',
      guidance: 'Maintain deployment',
      ref_links_guide: refLinksGuide.annb11,
      ref_links_technical: {},
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    spf9: {
      tag_name: 'ALL-redirect',
      guidance: 'Uses redirect tag with All',
      ref_links_guide: 'link',
      ref_links_technical: spfTechnical.tech61,
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    spf10: {
      tag_name: 'A-all',
      guidance: 'Follow implementation guide',
      ref_links_guide: refLinksGuide.annb11,
      ref_links_technical: {},
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    spf11: {
      tag_name: 'INCLUDE-limit',
      guidance: 'More than 10 lookups - Follow implementation guide',
      ref_links_guide: refLinksGuide.annb13,
      ref_links_technical: spfTechnical.tech464,
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
  },

  dkim: {
    dkim1: {
      tag_name: 'DKIM-GC',
      guidance: 'Government of Canada domains subject to TBS guidelines',
      ref_links_guide: 'IT PIN',
      ref_links_technical: {},
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    dkim2: {
      tag_name: 'DKIM-missing',
      guidance: 'Follow implementation guide',
      ref_links_guide: refLinksGuide.anna34,
      ref_links_technical: {},
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    dkim3: {
      tag_name: 'DKIM-missing-mx-O365',
      guidance:
        'DKIM record missing but MX uses O365. Follow cloud-specific guidance',
      ref_links_guide: refLinksGuide.a322,
      ref_links_technical: {
        link:
          'https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/use-dkim-to-validate-outbound-email?view=o365-worldwide',
      },
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    dkim4: {
      tag_name: 'DKIM-missing-O365-misconfigured',
      guidance:
        'DKIM CNAMEs do not exist, but MX points to *.onmicrosoft.com and SPF record includes O365.',
      ref_links_guide: refLinksGuide.a322,
      ref_links_technical: {
        link:
          'https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/use-dkim-to-validate-outbound-email?view=o365-worldwide',
      },
      ref_links_technical_hyperlink: '',
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    dkim5: {
      tag_name: 'P-sub1024',
      guidance: 'Public key RSA and key length <1024',
      ref_links_guide: refLinksGuide.annb322,
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    dkim6: {
      tag_name: 'P-1024',
      guidance: 'Public key RSA and key length 1024',
      ref_links_guide: refLinksGuide.annb322,
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    dkim7: {
      tag_name: 'P-2048',
      guidance: 'Public key RSA and key length 2048',
      ref_links_guide: refLinksGuide.annb322,
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    dkim8: {
      tag_name: 'P-4096',
      guidance: 'Public key RSA and key length 4096 or higher',
      ref_links_guide: refLinksGuide.annb322,
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    dkim9: {
      tag_name: 'P-invalid',
      guidance: 'Invalid public key',
      ref_links_guide: refLinksGuide.annb21,
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    dkim10: {
      tag_name: 'P-update-recommended',
      guidance: 'Public key in use for longer than 1 year',
      ref_links_guide: refLinksGuide.anna53,
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    dkim11: {
      tag_name: 'DKIM-invalid-crypto',
      guidance: 'DKIM key does not use RSA',
      ref_links_guide: refLinksGuide.annb322,
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    dkim12: {
      tag_name: 'DKIM-value-invalid',
      guidance: 'DKIM TXT record invalid',
      ref_links_guide: refLinksGuide.annb21,
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    dkim13: {
      tag_name: 'T-enabled',
      guidance:
        'As per RFC section 3.6.1, Testing flag t=y means Verifiers MUST treat messages as unsigned (i.e. DKIM is not enabled), so this flag should not be enabled.',
      ref_links_guide: 'DKIM Flag t',
      ref_links_technical: {
        link:
          'As per RFC section 3.6.1, Testing flag t=y means Verifiers MUST treat messages as unsigned (i.e. DKIM is not enabled), so this flag should not be enabled.',
      },
      summary: 'DKIM Flag t',
    },
  },

  ssl: {
    ssl1: {
      tag_name: 'SSL-GC',
      guidance: 'Government of Canada domains subject to TBS guidelines',
      ref_links: 'IT PIN',
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    ssl2: {
      tag_name: 'SSL-missing',
      guidance: 'Follow implementation guide',
      ref_links: 'link',
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    ssl3: {
      tag_name: 'SSL-rc4',
      guidance:
        'Accepted cipher list contains RC4 stream cipher, as prohibited by BOD 18-01',
      ref_links: 'link',
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    ssl4: {
      tag_name: 'SSL-3des',
      guidance:
        'Accepted cipher list contains 3DES symmetric-key block cipher, as prohibited by BOD 18-01',
      ref_links: 'link',
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    ssl5: {
      tag_name: 'SSL-acceptable-certificate',
      guidance: 'Certificate chain signed using SHA-256/SHA-384/AEAD',
      ref_links: 'link',
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    ssl6: {
      tag_name: 'SSL-invalid-cipher',
      guidance: 'One or more ciphers in use are not compliant with guidelines',
      ref_links: 'link',
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    ssl7: {
      tag_name: 'Vulnerability-heartbleed',
      guidance: 'Vulnerable to Heartbleed bug',
      ref_links: 'link',
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    ssl8: {
      tag_name: 'Vulnerability-ccs-injection',
      guidance: 'Vulnerable to OpenSSL CCS Injection',
      ref_links: 'link',
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
  },

  https: {
    https1: {
      tag_name: 'HTTPS-GC',
      guidance: 'Government of Canada domains subject to TBS guidelines',
      ref_links: 'IT PIN',
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    https2: {
      tag_name: 'HTTPS-missing',
      guidance: 'Follow implementation guide',
      ref_links: 'link',
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    https3: {
      tag_name: 'HTTPS-downgraded',
      guidance:
        'Canonical HTTPS endpoint internally redirects to HTTP. Follow guidance.',
      ref_links: 'link',
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    https4: {
      tag_name: 'HTTPS-bad-chain',
      guidance: 'HTTPS certificate chain is invalid',
      ref_links: 'link',
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    https5: {
      tag_name: 'HTTPS-bad-hostname',
      guidance: 'HTTPS endpoint failed hostname validation',
      ref_links: 'link',
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    https6: {
      tag_name: 'HTTPS-not-enforced',
      guidance: 'Domain does not enforce HTTPS',
      ref_links: 'link',
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    https7: {
      tag_name: 'HTTPS-weakly-enforced',
      guidance: 'Domain does not default to HTTPS',
      ref_links: 'link',
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    https8: {
      tag_name: 'HTTPS-moderately-enforced',
      guidance: 'Domain defaults to HTTPS, but eventually redirects to HTTP',
      ref_links: 'link',
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    https9: {
      tag_name: 'HSTS-missing',
      guidance: 'HTTP Strict Transport Security (HSTS) not implemented',
      ref_links: 'link',
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    https10: {
      tag_name: 'HSTS-short-age',
      guidance:
        'HTTP Strict Transport Security (HSTS) policy maximum age is shorter than one year',
      ref_links: 'link',
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    https11: {
      tag_name: 'HSTS-preload-ready',
      guidance: 'Domain not pre-loaded by HSTS, but is pre-load ready',
      ref_links: 'link',
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    https12: {
      tag_name: 'HSTS-not-preloaded',
      guidance: 'Domain not pre-loaded by HSTS',
      ref_links: 'link',
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    https13: {
      tag_name: 'HTTPS-certificate-expired',
      guidance: 'HTTPS certificate is expired',
      ref_links: 'link',
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
    https14: {
      tag_name: 'HTTPS-certificate-self-signed',
      guidance: 'HTTPS certificate is self-signed',
      ref_links: 'link',
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac ante eu sem tincidunt dictum. In hendrerit consectetur tellus, ac.',
    },
  },
}
