export const rawWebGuidancePageData = {
  findDomainByDomain: {
    domain: 'dfo-mpo.gc.ca',
    lastRan: '1615401033084',
    status: {
      https: 'FAIL',
      ssl: 'INFO',
    },
    web: {
      https: {
        edges: [
          {
            cursor: 'string',
            node: {
              id: 'MjkyMTM4NzUyNw==',
              timestamp: '1601947545252',
              implementation: 'Bad Chain',
              enforced: 'Strict',
              hsts: 'HSTS Max Age Too Short',
              hstsAge: '21672901',
              preloaded: 'HSTS Preload Ready',
              negativeGuidanceTags: {
                edges: [
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim2',
                      tagName: 'DKIM-GC',
                      guidance:
                        'DKIM CNAMEs do not exist, but MX points to *.onmicrosoft.com and SPF record includes O365.',
                      refLinks: [
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                        },
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink: '',
                        },
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                      ],
                      refLinksTech: [
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink: '',
                        },
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                      ],
                    },
                  },
                ],
              },
              neutralGuidanceTags: {
                edges: [
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim2',
                      tagName: 'DKIM-GC',
                      guidance:
                        'DKIM record missing but MX uses O365. Follow cloud-specific guidance',
                      refLinks: [
                        {
                          description: 'IT PIN',
                          refLink: '',
                        },
                        {
                          description: 'IT PIN',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                        },
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                      ],
                      refLinksTech: [
                        {
                          description: 'IT PIN',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                        },
                        {
                          description: 'IT PIN',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                        {
                          description: 'IT PIN',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                      ],
                    },
                  },
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim1',
                      tagName: 'DKIM-GC',
                      guidance:
                        'Government of Canada domains subject to TBS guidelines',
                      refLinks: [
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink: '',
                        },
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                        },
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                      ],
                      refLinksTech: [
                        {
                          description: 'IT PIN',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                        },
                        {
                          description: 'IT PIN',
                          refLink: '',
                        },
                        {
                          description: 'IT PIN',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink: '',
                        },
                      ],
                    },
                  },
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim2',
                      tagName: 'DKIM-missing-O365-misconfigured',
                      guidance:
                        'DKIM CNAMEs do not exist, but MX points to *.onmicrosoft.com and SPF record includes O365.',
                      refLinks: [],
                      refLinksTech: [
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                        },
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                        },
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                        {
                          description: 'IT PIN',
                          refLink: '',
                        },
                      ],
                    },
                  },
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim3',
                      tagName: 'DKIM-missing-O365-misconfigured',
                      guidance:
                        'Government of Canada domains subject to TBS guidelines',
                      refLinks: [],
                      refLinksTech: [
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                        },
                        {
                          description: 'IT PIN',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                        },
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink: '',
                        },
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink: '',
                        },
                      ],
                    },
                  },
                ],
              },
              positiveGuidanceTags: {
                edges: [
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim3',
                      tagName: 'DKIM-missing-mx-O365',
                      guidance:
                        'DKIM CNAMEs do not exist, but MX points to *.onmicrosoft.com and SPF record includes O365.',
                      refLinks: [
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink: '',
                        },
                        {
                          description: 'IT PIN',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                        },
                        {
                          description: 'IT PIN',
                          refLink: '',
                        },
                      ],
                      refLinksTech: [],
                    },
                  },
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim1',
                      tagName: 'DKIM-missing-mx-O365',
                      guidance: 'Follow implementation guide',
                      refLinks: [
                        {
                          description: 'IT PIN',
                          refLink: '',
                        },
                      ],
                      refLinksTech: [],
                    },
                  },
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim4',
                      tagName: 'DKIM-missing-mx-O365',
                      guidance:
                        'DKIM CNAMEs do not exist, but MX points to *.onmicrosoft.com and SPF record includes O365.',
                      refLinks: [],
                      refLinksTech: [
                        {
                          description: 'IT PIN',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink: '',
                        },
                      ],
                    },
                  },
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim2',
                      tagName: 'DKIM-GC',
                      guidance:
                        'DKIM record missing but MX uses O365. Follow cloud-specific guidance',
                      refLinks: [],
                      refLinksTech: [
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink: '',
                        },
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
      ssl: {
        edges: [],
      },
    },
  },
}

export const rawEmailGuidancePageData = {
  findDomainByDomain: {
    domain: 'cra-arc.gc.ca',
    lastRan: '1615384085361',
    dmarcPhase: 2,
    email: {
      dkim: {
        edges: [],
      },
      dmarc: {
        edges: [],
      },
      spf: {
        edges: [
          {
            cursor: 'string',
            node: {
              id: 'OTg5OTA3ODkxMg==',
              timestamp: '1585303361050',
              lookups: 2,
              record:
                'v=spf1 ip4:198.103.111.114/31 ip4:205.193.224.70 ip4:205.193.224.90 ip4:216.13.57.101 ip4:216.13.57.102 ip4:209.82.9.21 ip4:209.82.9.23 ip4:198.103.112.150/31 ip4:205.192.34.113 ip4:205.192.34.56 ip4:205.192.34.58 -all',
              spfDefault: 'fail',
              negativeGuidanceTags: {
                edges: [
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim3',
                      tagName: 'DKIM-missing',
                      guidance:
                        'Government of Canada domains subject to TBS guidelines',
                      refLinks: [
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink: '',
                        },
                      ],
                      refLinksTech: [
                        {
                          description: 'IT PIN',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                        },
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink: '',
                        },
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                      ],
                    },
                  },
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim4',
                      tagName: 'DKIM-missing-mx-O365',
                      guidance:
                        'DKIM CNAMEs do not exist, but MX points to *.onmicrosoft.com and SPF record includes O365.',
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
                          description: '3.2.2 Third Parties and DKIM',
                          refLink: '',
                        },
                      ],
                    },
                  },
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim2',
                      tagName: 'DKIM-missing-mx-O365',
                      guidance: 'Follow implementation guide',
                      refLinks: [
                        {
                          description: 'IT PIN',
                          refLink: '',
                        },
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                        },
                      ],
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
              neutralGuidanceTags: {
                edges: [
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim4',
                      tagName: 'DKIM-missing-O365-misconfigured',
                      guidance:
                        'DKIM record missing but MX uses O365. Follow cloud-specific guidance',
                      refLinks: [],
                      refLinksTech: [
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                        {
                          description: 'IT PIN',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink: '',
                        },
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
              positiveGuidanceTags: {
                edges: [
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim4',
                      tagName: 'DKIM-missing',
                      guidance: 'Follow implementation guide',
                      refLinks: [
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink: '',
                        },
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                        },
                        {
                          description: 'IT PIN',
                          refLink: '',
                        },
                      ],
                      refLinksTech: [
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
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
          {
            cursor: 'string',
            node: {
              id: 'Njc4NTAyODg4OA==',
              timestamp: '1587686964363',
              lookups: 3,
              record:
                'v=spf1 ip4:40.92.0.0/15 ip4:40.107.0.0/16 ip4:52.100.0.0/14 ip4:104.47.0.0/17 ip6:2a01:111:f400::/48 ip6:2a01:111:f403::/48 -all',
              spfDefault: 'neutral',
              negativeGuidanceTags: {
                edges: [
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim1',
                      tagName: 'DKIM-missing',
                      guidance:
                        'Government of Canada domains subject to TBS guidelines',
                      refLinks: [
                        {
                          description: 'IT PIN',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                      ],
                      refLinksTech: [
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                      ],
                    },
                  },
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim3',
                      tagName: 'DKIM-missing-O365-misconfigured',
                      guidance:
                        'DKIM CNAMEs do not exist, but MX points to *.onmicrosoft.com and SPF record includes O365.',
                      refLinks: [
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                        },
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink: '',
                        },
                      ],
                      refLinksTech: [],
                    },
                  },
                ],
              },
              neutralGuidanceTags: {
                edges: [],
              },
              positiveGuidanceTags: {
                edges: [
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim3',
                      tagName: 'DKIM-missing-mx-O365',
                      guidance:
                        'DKIM CNAMEs do not exist, but MX points to *.onmicrosoft.com and SPF record includes O365.',
                      refLinks: [
                        {
                          description: 'IT PIN',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                        },
                        {
                          description: 'IT PIN',
                          refLink: '',
                        },
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                        },
                      ],
                      refLinksTech: [
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink: '',
                        },
                        {
                          description: 'IT PIN',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                        },
                        {
                          description: 'IT PIN',
                          refLink: '',
                        },
                      ],
                    },
                  },
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim1',
                      tagName: 'DKIM-missing',
                      guidance:
                        'DKIM record missing but MX uses O365. Follow cloud-specific guidance',
                      refLinks: [
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                        },
                        {
                          description: 'IT PIN',
                          refLink: '',
                        },
                      ],
                      refLinksTech: [
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink: '',
                        },
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                        {
                          description: 'IT PIN',
                          refLink: '',
                        },
                      ],
                    },
                  },
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim3',
                      tagName: 'DKIM-missing',
                      guidance:
                        'DKIM record missing but MX uses O365. Follow cloud-specific guidance',
                      refLinks: [
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                        },
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                        },
                      ],
                      refLinksTech: [],
                    },
                  },
                ],
              },
            },
          },
          {
            cursor: 'string',
            node: {
              id: 'MTQ0MDMxNTU0Ng==',
              timestamp: '1607683081521',
              lookups: 3,
              record:
                'v=spf1 ip4:198.103.111.114/31 ip4:205.193.224.70 ip4:205.193.224.90 ip4:216.13.57.101 ip4:216.13.57.102 ip4:209.82.9.21 ip4:209.82.9.23 ip4:198.103.112.150/31 ip4:205.192.34.113 ip4:205.192.34.56 ip4:205.192.34.58 -all',
              spfDefault: 'include',
              negativeGuidanceTags: {
                edges: [
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim1',
                      tagName: 'DKIM-missing',
                      guidance:
                        'DKIM record missing but MX uses O365. Follow cloud-specific guidance',
                      refLinks: [
                        {
                          description: 'IT PIN',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                      ],
                      refLinksTech: [
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                        {
                          description: 'IT PIN',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                        {
                          description: 'IT PIN',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                        },
                      ],
                    },
                  },
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim3',
                      tagName: 'DKIM-missing-mx-O365',
                      guidance:
                        'Government of Canada domains subject to TBS guidelines',
                      refLinks: [
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink: '',
                        },
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink: '',
                        },
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                      ],
                      refLinksTech: [
                        {
                          description: 'IT PIN',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                        },
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink: '',
                        },
                        {
                          description: 'IT PIN',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                        },
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                      ],
                    },
                  },
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim3',
                      tagName: 'DKIM-missing',
                      guidance: 'Follow implementation guide',
                      refLinks: [
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                        {
                          description: 'IT PIN',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                        },
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
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                        {
                          description: 'IT PIN',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                        {
                          description: 'IT PIN',
                          refLink: '',
                        },
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                      ],
                    },
                  },
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim4',
                      tagName: 'DKIM-missing-mx-O365',
                      guidance:
                        'DKIM CNAMEs do not exist, but MX points to *.onmicrosoft.com and SPF record includes O365.',
                      refLinks: [
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                      ],
                      refLinksTech: [
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                        {
                          description: 'IT PIN',
                          refLink: '',
                        },
                      ],
                    },
                  },
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim3',
                      tagName: 'DKIM-GC',
                      guidance: 'Follow implementation guide',
                      refLinks: [
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink: '',
                        },
                        {
                          description: 'IT PIN',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                      ],
                      refLinksTech: [
                        {
                          description: 'IT PIN',
                          refLink: '',
                        },
                        {
                          description: 'IT PIN',
                          refLink: '',
                        },
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
              neutralGuidanceTags: {
                edges: [
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim3',
                      tagName: 'DKIM-GC',
                      guidance:
                        'DKIM record missing but MX uses O365. Follow cloud-specific guidance',
                      refLinks: [
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink: '',
                        },
                      ],
                      refLinksTech: [],
                    },
                  },
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim1',
                      tagName: 'DKIM-missing-O365-misconfigured',
                      guidance:
                        'DKIM record missing but MX uses O365. Follow cloud-specific guidance',
                      refLinks: [
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                        },
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                        },
                      ],
                      refLinksTech: [],
                    },
                  },
                ],
              },
              positiveGuidanceTags: {
                edges: [
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim3',
                      tagName: 'DKIM-missing-O365-misconfigured',
                      guidance: 'Follow implementation guide',
                      refLinks: [
                        {
                          description: 'IT PIN',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink: '',
                        },
                      ],
                      refLinksTech: [],
                    },
                  },
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim4',
                      tagName: 'DKIM-missing-O365-misconfigured',
                      guidance:
                        'DKIM CNAMEs do not exist, but MX points to *.onmicrosoft.com and SPF record includes O365.',
                      refLinks: [],
                      refLinksTech: [
                        {
                          description: 'IT PIN',
                          refLink: '',
                        },
                        {
                          description: 'IT PIN',
                          refLink: '',
                        },
                        {
                          description: 'IT PIN',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                        },
                      ],
                    },
                  },
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim1',
                      tagName: 'DKIM-missing-mx-O365',
                      guidance:
                        'DKIM CNAMEs do not exist, but MX points to *.onmicrosoft.com and SPF record includes O365.',
                      refLinks: [
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                        },
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                        {
                          description: 'IT PIN',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                      ],
                      refLinksTech: [
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                        },
                        {
                          description: '3.2.2 Third Parties and DKIM',
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
          {
            cursor: 'string',
            node: {
              id: 'NjAzNjUzNzUwOA==',
              timestamp: '1597422614562',
              lookups: 5,
              record:
                'v=spf1 ip4:40.92.0.0/15 ip4:40.107.0.0/16 ip4:52.100.0.0/14 ip4:104.47.0.0/17 ip6:2a01:111:f400::/48 ip6:2a01:111:f403::/48 -all',
              spfDefault: 'neutral',
              negativeGuidanceTags: {
                edges: [
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim3',
                      tagName: 'DKIM-missing-mx-O365',
                      guidance:
                        'Government of Canada domains subject to TBS guidelines',
                      refLinks: [
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                      ],
                      refLinksTech: [
                        {
                          description: 'IT PIN',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                        {
                          description: 'IT PIN',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                      ],
                    },
                  },
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim2',
                      tagName: 'DKIM-GC',
                      guidance:
                        'Government of Canada domains subject to TBS guidelines',
                      refLinks: [
                        {
                          description: 'IT PIN',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                      ],
                      refLinksTech: [],
                    },
                  },
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim3',
                      tagName: 'DKIM-missing-mx-O365',
                      guidance:
                        'DKIM record missing but MX uses O365. Follow cloud-specific guidance',
                      refLinks: [
                        {
                          description: 'IT PIN',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                        },
                      ],
                      refLinksTech: [],
                    },
                  },
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim4',
                      tagName: 'DKIM-missing',
                      guidance:
                        'DKIM record missing but MX uses O365. Follow cloud-specific guidance',
                      refLinks: [
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink: '',
                        },
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink: '',
                        },
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink: '',
                        },
                      ],
                      refLinksTech: [
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink: '',
                        },
                        {
                          description: 'IT PIN',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                      ],
                    },
                  },
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim4',
                      tagName: 'DKIM-missing-mx-O365',
                      guidance:
                        'Government of Canada domains subject to TBS guidelines',
                      refLinks: [
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                      ],
                      refLinksTech: [
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                      ],
                    },
                  },
                ],
              },
              neutralGuidanceTags: {
                edges: [
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim2',
                      tagName: 'DKIM-missing',
                      guidance:
                        'Government of Canada domains subject to TBS guidelines',
                      refLinks: [],
                      refLinksTech: [
                        {
                          description: 'IT PIN',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                        {
                          description: 'IT PIN',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                        },
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                      ],
                    },
                  },
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim3',
                      tagName: 'DKIM-GC',
                      guidance:
                        'DKIM CNAMEs do not exist, but MX points to *.onmicrosoft.com and SPF record includes O365.',
                      refLinks: [
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                        },
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                      ],
                      refLinksTech: [
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink: '',
                        },
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                        },
                      ],
                    },
                  },
                ],
              },
              positiveGuidanceTags: {
                edges: [],
              },
            },
          },
        ],
      },
    },
  },
}
