export const rawDmarcGuidancePageData = {
  findDomainByDomain: {
    id: 'NjA3NjkxNzk5NQ==',
    domain: 'forces.gc.ca',
    lastRan: '2021-03-21T18:59:26Z',
    status: {
      https: 'PASS',
      ssl: 'PASS',
      __typename: 'DomainStatus',
    },
    dmarcPhase: 'deploy',
    web: {
      https: {
        edges: [
          {
            cursor: 'string',
            node: {
              id: 'OTg2MDQ0NjA0',
              timestamp: '2020-05-22T00:11:52Z',
              implementation: 'Hello World',
              enforced: 'Hello World',
              hsts: 'Hello World',
              hstsAge: 'Hello World',
              preloaded: 'Hello World',
              negativeGuidanceTags: {
                edges: [
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
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                          __typename: 'RefLinks',
                        },
                      ],
                      __typename: 'GuidanceTag',
                    },
                    __typename: 'GuidanceTagEdge',
                  },
                ],
                __typename: 'GuidanceTagConnection',
              },
              neutralGuidanceTags: {
                edges: [
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
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                          __typename: 'RefLinks',
                        },
                      ],
                      __typename: 'GuidanceTag',
                    },
                    __typename: 'GuidanceTagEdge',
                  },
                ],
                __typename: 'GuidanceTagConnection',
              },
              positiveGuidanceTags: {
                edges: [
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
                          __typename: 'RefLinks',
                        },
                      ],
                      refLinksTech: [
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink: '',
                          __typename: 'RefLinks',
                        },
                      ],
                      __typename: 'GuidanceTag',
                    },
                    __typename: 'GuidanceTagEdge',
                  },
                ],
                __typename: 'GuidanceTagConnection',
              },
              __typename: 'HTTPS',
            },
            __typename: 'HTTPSEdge',
          },
        ],
        __typename: 'HTTPSConnection',
      },
      ssl: {
        edges: [
          {
            cursor: 'string',
            node: {
              id: 'ODQ5NDA2NzE2',
              timestamp: '2020-07-19T02:26:33Z',
              ccsInjectionVulnerable: false,
              heartbleedVulnerable: false,
              supportsEcdhKeyExchange: true,
              acceptableCiphers: ['Hello World', 'Hello World'],
              acceptableCurves: ['Hello World', 'Hello World'],
              strongCiphers: ['Hello World', 'Hello World'],
              strongCurves: ['Hello World', 'Hello World'],
              weakCiphers: ['Hello World', 'Hello World'],
              weakCurves: ['Hello World', 'Hello World'],
              negativeGuidanceTags: {
                edges: [],
                __typename: 'GuidanceTagConnection',
              },
              neutralGuidanceTags: {
                edges: [
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
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                          __typename: 'RefLinks',
                        },
                        {
                          description: 'IT PIN',
                          refLink: '',
                          __typename: 'RefLinks',
                        },
                      ],
                      __typename: 'GuidanceTag',
                    },
                    __typename: 'GuidanceTagEdge',
                  },
                ],
                __typename: 'GuidanceTagConnection',
              },
              positiveGuidanceTags: {
                edges: [
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim1',
                      tagName: 'DKIM-GC',
                      guidance:
                        'DKIM CNAMEs do not exist, but MX points to *.onmicrosoft.com and SPF record includes O365.',
                      refLinks: [
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                          __typename: 'RefLinks',
                        },
                      ],
                      refLinksTech: [
                        {
                          description: 'IT PIN',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                          __typename: 'RefLinks',
                        },
                      ],
                      __typename: 'GuidanceTag',
                    },
                    __typename: 'GuidanceTagEdge',
                  },
                ],
                __typename: 'GuidanceTagConnection',
              },
              __typename: 'SSL',
            },
            __typename: 'SSLEdge',
          },
        ],
        __typename: 'SSLConnection',
      },
      __typename: 'WebScan',
    },
    email: {
      dkim: {
        edges: [
          {
            cursor: 'string',
            node: {
              id: 'NTczNjA5OTg1Ng==',
              timestamp: '2020-12-23T19:47:53Z',
              results: {
                edges: [
                  {
                    cursor: 'string',
                    node: {
                      selector: 'selector3',
                      negativeGuidanceTags: {
                        edges: [
                          {
                            cursor: 'string',
                            node: {
                              tagId: 'dkim1',
                              tagName: 'DKIM-missing-mx-O365',
                              guidance:
                                'DKIM record missing but MX uses O365. Follow cloud-specific guidance',
                              refLinks: [
                                {
                                  description:
                                    'A.3.4 Deploy DKIM for All Domains and senders',
                                  refLink: '',
                                  __typename: 'RefLinks',
                                },
                                {
                                  description: '3.2.2 Third Parties and DKIM',
                                  refLink:
                                    'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                                  __typename: 'RefLinks',
                                },
                                {
                                  description:
                                    'A.3.4 Deploy DKIM for All Domains and senders',
                                  refLink: '',
                                  __typename: 'RefLinks',
                                },
                              ],
                              refLinksTech: [
                                {
                                  description:
                                    'A.3.4 Deploy DKIM for All Domains and senders',
                                  refLink:
                                    'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                                  __typename: 'RefLinks',
                                },
                              ],
                              __typename: 'GuidanceTag',
                            },
                            __typename: 'GuidanceTagEdge',
                          },
                        ],
                        __typename: 'GuidanceTagConnection',
                      },
                      neutralGuidanceTags: {
                        edges: [
                          {
                            cursor: 'string',
                            node: {
                              tagId: 'dkim2',
                              tagName: 'DKIM-missing-mx-O365',
                              guidance:
                                'Government of Canada domains subject to TBS guidelines',
                              refLinks: [
                                {
                                  description: 'IT PIN',
                                  refLink: '',
                                  __typename: 'RefLinks',
                                },
                              ],
                              refLinksTech: [
                                {
                                  description:
                                    'A.3.4 Deploy DKIM for All Domains and senders',
                                  refLink:
                                    'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                                  __typename: 'RefLinks',
                                },
                              ],
                              __typename: 'GuidanceTag',
                            },
                            __typename: 'GuidanceTagEdge',
                          },
                        ],
                        __typename: 'GuidanceTagConnection',
                      },
                      positiveGuidanceTags: {
                        edges: [],
                        __typename: 'GuidanceTagConnection',
                      },
                      __typename: 'DKIMResult',
                    },
                    __typename: 'DKIMResultEdge',
                  },
                ],
                __typename: 'DKIMResultConnection',
              },
              __typename: 'DKIM',
            },
            __typename: 'DKIMEdge',
          },
        ],
        __typename: 'DKIMConnection',
      },
      dmarc: {
        edges: [
          {
            cursor: 'string',
            node: {
              id: 'MTU4MjUzMDA5OA==',
              timestamp: '2020-05-19T21:29:00Z',
              record:
                'v=DMARC1; p=none; pct=100; rua=mailto:dmarc@cyber.gc.ca; ruf=mailto:dmarc@cyber.gc.ca; fo=1',
              pPolicy: 'reject',
              spPolicy: 'quarantine',
              pct: 100,
              negativeGuidanceTags: {
                edges: [
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim4',
                      tagName: 'DKIM-missing',
                      guidance:
                        'DKIM record missing but MX uses O365. Follow cloud-specific guidance',
                      refLinks: [],
                      refLinksTech: [],
                      __typename: 'GuidanceTag',
                    },
                    __typename: 'GuidanceTagEdge',
                  },
                ],
                __typename: 'GuidanceTagConnection',
              },
              neutralGuidanceTags: {
                edges: [
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim3',
                      tagName: 'DKIM-missing',
                      guidance:
                        'Government of Canada domains subject to TBS guidelines',
                      refLinks: [],
                      refLinksTech: [
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                          __typename: 'RefLinks',
                        },
                      ],
                      __typename: 'GuidanceTag',
                    },
                    __typename: 'GuidanceTagEdge',
                  },
                ],
                __typename: 'GuidanceTagConnection',
              },
              positiveGuidanceTags: {
                edges: [
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim1',
                      tagName: 'DKIM-missing-mx-O365',
                      guidance: 'Follow implementation guide',
                      refLinks: [
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                          __typename: 'RefLinks',
                        },
                      ],
                      refLinksTech: [
                        {
                          description: 'IT PIN',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                          __typename: 'RefLinks',
                        },
                      ],
                      __typename: 'GuidanceTag',
                    },
                    __typename: 'GuidanceTagEdge',
                  },
                ],
                __typename: 'GuidanceTagConnection',
              },
              __typename: 'DMARC',
            },
            __typename: 'DMARCEdge',
          },
        ],
        __typename: 'DMARCConnection',
      },
      spf: {
        edges: [
          {
            cursor: 'string',
            node: {
              id: 'NTQxNTk1MTczMA==',
              timestamp: '2020-08-02T14:34:42Z',
              lookups: 3,
              record:
                'v=spf1 ip4:40.92.0.0/15 ip4:40.107.0.0/16 ip4:52.100.0.0/14 ip4:104.47.0.0/17 ip6:2a01:111:f400::/48 ip6:2a01:111:f403::/48 -all',
              spfDefault: 'fail',
              negativeGuidanceTags: {
                edges: [
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim1',
                      tagName: 'DKIM-GC',
                      guidance:
                        'DKIM CNAMEs do not exist, but MX points to *.onmicrosoft.com and SPF record includes O365.',
                      refLinks: [
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                          __typename: 'RefLinks',
                        },
                      ],
                      refLinksTech: [
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                          __typename: 'RefLinks',
                        },
                      ],
                      __typename: 'GuidanceTag',
                    },
                    __typename: 'GuidanceTagEdge',
                  },
                ],
                __typename: 'GuidanceTagConnection',
              },
              neutralGuidanceTags: {
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
                          description: 'IT PIN',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                          __typename: 'RefLinks',
                        },
                      ],
                      refLinksTech: [
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                          __typename: 'RefLinks',
                        },
                      ],
                      __typename: 'GuidanceTag',
                    },
                    __typename: 'GuidanceTagEdge',
                  },
                ],
                __typename: 'GuidanceTagConnection',
              },
              positiveGuidanceTags: {
                edges: [
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim1',
                      tagName: 'DKIM-missing-mx-O365',
                      guidance: 'Follow implementation guide',
                      refLinks: [
                        {
                          description: 'IT PIN',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                          __typename: 'RefLinks',
                        },
                      ],
                      refLinksTech: [
                        {
                          description: 'IT PIN',
                          refLink: '',
                          __typename: 'RefLinks',
                        },
                      ],
                      __typename: 'GuidanceTag',
                    },
                    __typename: 'GuidanceTagEdge',
                  },
                ],
                __typename: 'GuidanceTagConnection',
              },
              __typename: 'SPF',
            },
            __typename: 'SPFEdge',
          },
        ],
        __typename: 'SPFConnection',
      },
      __typename: 'EmailScan',
    },
    __typename: 'Domain',
  },
}
