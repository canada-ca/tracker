export const rawDmarcGuidancePageData = {
  findDomainByDomain: {
    domain: 'agr.gc.ca',
    lastRan: '1611622842375',
    web: {
      https: {
        edges: [
          {
            cursor: 'string',
            node: {
              id: 'ODU1MzY4ODEz',
              timestamp: '1599705110284',
              implementation: 'Bad Hostname',
              enforced: 'Weak',
              hsts: 'No HSTS',
              hstsAge: '21672901',
              preloaded: 'HSTS Preload Ready',
              guidanceTags: {
                edges: [
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim1',
                      tagName: 'DKIM-missing-mx-O365',
                      guidance:
                        'Government of Canada domains subject to TBS guidelines',
                      refLinks: [
                        {
                          description: 'IT PIN',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                        },
                      ],
                      refLinksTech: [
                        {
                          description: 'IT PIN',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                      ],
                    },
                  },
                ],
              },
            },
          },
        ],
      },
      ssl: {
        edges: [
          {
            cursor: 'string',
            node: {
              id: 'NzMzMzUzNjQxNQ==',
              timestamp: '1589677358962',
              guidanceTags: {
                edges: [
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim1',
                      tagName: 'DKIM-GC',
                      guidance: 'Follow implementation guide',
                      refLinks: [],
                      refLinksTech: [
                        {
                          description: 'IT PIN',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                        },
                      ],
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    },
    email: {
      dkim: {
        edges: [
          {
            cursor: 'string',
            node: {
              id: 'MjM2MTgzOTAw',
              timestamp: '1592456126286',
              results: {
                edges: [
                  {
                    cursor: 'string',
                    node: {
                      selector: 'selector3',
                      guidanceTags: {
                        edges: [
                          {
                            cursor: 'string',
                            node: {
                              tagName: 'DKIM-missing-mx-O365',
                              guidance:
                                'Government of Canada domains subject to TBS guidelines',
                              refLinks: [
                                {
                                  description:
                                    'A.3.4 Deploy DKIM for All Domains and senders',
                                  refLink:
                                    'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                                },
                              ],
                              refLinksTech: [
                                {
                                  description:
                                    'A.3.4 Deploy DKIM for All Domains and senders',
                                  refLink:
                                    'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                                },
                              ],
                            },
                          },
                        ],
                      },
                    },
                  },
                ],
              },
            },
          },
        ],
      },
      dmarc: {
        edges: [
          {
            cursor: 'string',
            node: {
              id: 'NjAyMzcxOTQ5Mg==',
              timestamp: '1595049374594',
              dmarcPhase: 2,
              record:
                'v=DMARC1; p=none; pct=100; rua=mailto:dmarc@cyber.gc.ca; ruf=mailto:dmarc@cyber.gc.ca; fo=1',
              pPolicy: 'none',
              spPolicy: 'quarantine',
              pct: 90,
              guidanceTags: {
                edges: [
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim4',
                      tagName: 'DKIM-missing-O365-misconfigured',
                      guidance:
                        'Government of Canada domains subject to TBS guidelines',
                      refLinks: [
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                        },
                      ],
                      refLinksTech: [
                        {
                          description: 'IT PIN',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                      ],
                    },
                  },
                ],
              },
            },
          },
        ],
      },
      spf: {
        edges: [
          {
            cursor: 'string',
            node: {
              id: 'Mzc5ODc1NDU3Ng==',
              timestamp: '1608622033538',
              lookups: 9,
              record:
                'v=spf1 ip4:40.92.0.0/15 ip4:40.107.0.0/16 ip4:52.100.0.0/14 ip4:104.47.0.0/17 ip6:2a01:111:f400::/48 ip6:2a01:111:f403::/48 -all',
              spfDefault: 'include',
              guidanceTags: {
                edges: [
                  {
                    cursor: 'string',
                    node: {
                      tagName: 'DKIM-missing',
                      guidance:
                        'DKIM CNAMEs do not exist, but MX points to *.onmicrosoft.com and SPF record includes O365.',
                      refLinks: [
                        {
                          description: 'IT PIN',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                        },
                      ],
                      refLinksTech: [
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                      ],
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    },
  },
}
