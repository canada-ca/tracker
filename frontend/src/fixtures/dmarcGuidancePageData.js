export const rawWebGuidancePageData = {
  data: {
    findDomainByDomain: {
      id: 'OTg2MDI4NzU3MQ==',
      domain: 'cra.arc.gc.ca',
      lastRan: '1615781984503',
      status: {
        https: 'INFO',
        ssl: 'PASS',
        __typename: 'DomainStatus',
      },
      web: {
        https: {
          edges: [
            {
              cursor: 'string',
              node: {
                id: 'OTkxMzE3OTg1NQ==',
                timestamp: '1608886189694',
                negativeGuidanceTags: {
                  edges: [
                    {
                      cursor: 'string',
                      node: {
                        id: 'NDkxODcyMTE4Nw==',
                        tagId: 'dkim2',
                        tagName: 'DKIM-GC',
                        guidance:
                          'DKIM CNAMEs do not exist, but MX points to *.onmicrosoft.com and SPF record includes O365.',
                        refLinks: [
                          {
                            description:
                              'A.3.4 Deploy DKIM for All Domains and senders',
                            refLink: '',
                            __typename: 'RefLinks',
                          },
                        ],
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
                        id: 'Nzg2MTUzOTU1Ng==',
                        tagId: 'dkim2',
                        tagName: 'DKIM-missing-O365-misconfigured',
                        guidance:
                          'DKIM record missing but MX uses O365. Follow cloud-specific guidance',
                        refLinks: [
                          {
                            description:
                              'A.3.4 Deploy DKIM for All Domains and senders',
                            refLink: '',
                            __typename: 'RefLinks',
                          },
                        ],
                        refLinksTech: [],
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
                        id: 'NTg1MTczNjM4MA==',
                        tagId: 'dkim2',
                        tagName: 'DKIM-GC',
                        guidance:
                          'DKIM record missing but MX uses O365. Follow cloud-specific guidance',
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
            {
              cursor: 'string',
              node: {
                id: 'OTcyNjg5Nzc4MA==',
                timestamp: '1609874998413',
                negativeGuidanceTags: {
                  edges: [
                    {
                      cursor: 'string',
                      node: {
                        id: 'MjY1NDAwMjI4Mw==',
                        tagId: 'dkim2',
                        tagName: 'DKIM-missing-O365-misconfigured',
                        guidance:
                          'DKIM record missing but MX uses O365. Follow cloud-specific guidance',
                        refLinks: [],
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
                neutralGuidanceTags: {
                  edges: [
                    {
                      cursor: 'string',
                      node: {
                        id: 'NTA4NzM5MDQyMA==',
                        tagId: 'dkim2',
                        tagName: 'DKIM-missing',
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
                positiveGuidanceTags: {
                  edges: [
                    {
                      cursor: 'string',
                      node: {
                        id: 'NTYxNTkwNjc5NA==',
                        tagId: 'dkim3',
                        tagName: 'DKIM-missing-O365-misconfigured',
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
                            description: '3.2.2 Third Parties and DKIM',
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
                id: 'MjcyMjE0MDUxMw==',
                timestamp: '1584699570106',
                negativeGuidanceTags: {
                  edges: [
                    {
                      cursor: 'string',
                      node: {
                        id: 'MzI1NjQ3NTIwOA==',
                        tagId: 'dkim4',
                        tagName: 'DKIM-missing-mx-O365',
                        guidance:
                          'DKIM CNAMEs do not exist, but MX points to *.onmicrosoft.com and SPF record includes O365.',
                        refLinks: [
                          {
                            description: '3.2.2 Third Parties and DKIM',
                            refLink: '',
                            __typename: 'RefLinks',
                          },
                        ],
                        refLinksTech: [
                          {
                            description: '3.2.2 Third Parties and DKIM',
                            refLink: '',
                            __typename: 'RefLinks',
                          },
                        ],
                        __typename: 'GuidanceTag',
                      },
                      __typename: 'GuidanceTagEdge',
                    },
                    {
                      cursor: 'string',
                      node: {
                        id: 'MzEwMDQ4MjE5Mg==',
                        tagId: 'dkim3',
                        tagName: 'DKIM-missing-O365-misconfigured',
                        guidance:
                          'DKIM record missing but MX uses O365. Follow cloud-specific guidance',
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
                neutralGuidanceTags: {
                  edges: [
                    {
                      cursor: 'string',
                      node: {
                        id: 'MzA5MDYxMDI=',
                        tagId: 'dkim1',
                        tagName: 'DKIM-missing-O365-misconfigured',
                        guidance:
                          'DKIM CNAMEs do not exist, but MX points to *.onmicrosoft.com and SPF record includes O365.',
                        refLinks: [
                          {
                            description: '3.2.2 Third Parties and DKIM',
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
                    {
                      cursor: 'string',
                      node: {
                        id: 'ODU0MTUzMzgzOQ==',
                        tagId: 'dkim2',
                        tagName: 'DKIM-GC',
                        guidance:
                          'DKIM record missing but MX uses O365. Follow cloud-specific guidance',
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
                        id: 'MTgyNTg3OTEwOQ==',
                        tagId: 'dkim3',
                        tagName: 'DKIM-missing-O365-misconfigured',
                        guidance:
                          'DKIM record missing but MX uses O365. Follow cloud-specific guidance',
                        refLinks: [
                          {
                            description:
                              'A.3.4 Deploy DKIM for All Domains and senders',
                            refLink:
                              'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                            __typename: 'RefLinks',
                          },
                        ],
                        refLinksTech: [],
                        __typename: 'GuidanceTag',
                      },
                      __typename: 'GuidanceTagEdge',
                    },
                    {
                      cursor: 'string',
                      node: {
                        id: 'OTYzNTc4NDM4',
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
                            description:
                              'A.3.4 Deploy DKIM for All Domains and senders',
                            refLink: '',
                            __typename: 'RefLinks',
                          },
                          {
                            description: '3.2.2 Third Parties and DKIM',
                            refLink:
                              'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                            __typename: 'RefLinks',
                          },
                        ],
                        __typename: 'GuidanceTag',
                      },
                      __typename: 'GuidanceTagEdge',
                    },
                    {
                      cursor: 'string',
                      node: {
                        id: 'MjQ4NzY3NTc4OQ==',
                        tagId: 'dkim4',
                        tagName: 'DKIM-missing',
                        guidance:
                          'DKIM CNAMEs do not exist, but MX points to *.onmicrosoft.com and SPF record includes O365.',
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
                __typename: 'SSL',
              },
              __typename: 'SSLEdge',
            },
          ],
          __typename: 'SSLConnection',
        },
        __typename: 'WebScan',
      },
      __typename: 'Domain',
    },
  },
}

export const rawEmailGuidancePageData = {
  data: {
    findDomainByDomain: {
      id: 'ODk5NTExNTkwNg==',
      domain: "jAva&Tab;script:alert('XSS')",
      lastRan: '1615761663832',
      dmarcPhase: 2,
      email: {
        dkim: {
          edges: [
            {
              cursor: 'string',
              node: {
                id: 'MjI0MDkzMTMyOA==',
                timestamp: '1601353131431',
                results: {
                  edges: [
                    {
                      cursor: 'string',
                      node: {
                        selector: 'selector2',
                        negativeGuidanceTags: {
                          edges: [
                            {
                              cursor: 'string',
                              node: {
                                id: 'NjM0OTcwNzI1Mg==',
                                tagId: 'dkim1',
                                tagName: 'DKIM-missing-mx-O365',
                                guidance:
                                  'DKIM record missing but MX uses O365. Follow cloud-specific guidance',
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
                        neutralGuidanceTags: {
                          edges: [
                            {
                              cursor: 'string',
                              node: {
                                id: 'ODY4NjQ5NTczOQ==',
                                tagId: 'dkim3',
                                tagName: 'DKIM-missing-O365-misconfigured',
                                guidance:
                                  'DKIM CNAMEs do not exist, but MX points to *.onmicrosoft.com and SPF record includes O365.',
                                refLinks: [
                                  {
                                    description: '3.2.2 Third Parties and DKIM',
                                    refLink:
                                      'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
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
                          edges: [
                            {
                              cursor: 'string',
                              node: {
                                id: 'NDc3NDE1OTUzMg==',
                                tagId: 'dkim3',
                                tagName: 'DKIM-missing',
                                guidance:
                                  'DKIM record missing but MX uses O365. Follow cloud-specific guidance',
                                refLinks: [],
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
                id: 'NTAyODU3NzUwNQ==',
                timestamp: '1585895409204',
                record:
                  'v=DMARC1; p=none; pct=100; rua=mailto:dmarc@cyber.gc.ca; ruf=mailto:dmarc@cyber.gc.ca; fo=1',
                pPolicy: 'quarantine',
                spPolicy: 'reject',
                pct: 70,
                negativeGuidanceTags: {
                  edges: [
                    {
                      cursor: 'string',
                      node: {
                        id: 'OTExNzM4NjMxMw==',
                        tagId: 'dkim1',
                        tagName: 'DKIM-missing-O365-misconfigured',
                        guidance: 'Follow implementation guide',
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
                        id: 'MTcxOTA4MDkzMQ==',
                        tagId: 'dkim1',
                        tagName: 'DKIM-GC',
                        guidance:
                          'Government of Canada domains subject to TBS guidelines',
                        refLinks: [],
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
                  edges: [],
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
                id: 'OTYzMzMxMjUxOA==',
                timestamp: '1611130263857',
                negativeGuidanceTags: {
                  edges: [
                    {
                      cursor: 'string',
                      node: {
                        id: 'MzEwMzUzMjgyOA==',
                        tagId: 'dkim3',
                        tagName: 'DKIM-missing-O365-misconfigured',
                        guidance:
                          'DKIM CNAMEs do not exist, but MX points to *.onmicrosoft.com and SPF record includes O365.',
                        refLinks: [
                          {
                            description: 'IT PIN',
                            refLink: '',
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
                neutralGuidanceTags: {
                  edges: [
                    {
                      cursor: 'string',
                      node: {
                        id: 'Njk1ODIxODIxMg==',
                        tagId: 'dkim3',
                        tagName: 'DKIM-missing',
                        guidance:
                          'DKIM record missing but MX uses O365. Follow cloud-specific guidance',
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
                positiveGuidanceTags: {
                  edges: [
                    {
                      cursor: 'string',
                      node: {
                        id: 'NTMxOTMzOTA4',
                        tagId: 'dkim4',
                        tagName: 'DKIM-missing',
                        guidance:
                          'DKIM CNAMEs do not exist, but MX points to *.onmicrosoft.com and SPF record includes O365.',
                        refLinks: [],
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
  },
}
