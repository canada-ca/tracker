export const rawWebGuidancePageData = {
  findDomainByDomain: {
    domain: 'cra-arc.gc.ca',
    lastRan: '1612170063153',
    status: {
      https: 'INFO',
      ssl: 'PASS',
    },
    web: {
      https: {
        edges: [
          {
            cursor: 'string',
            node: {
              id: 'MTQzNjkzMjExMg==',
              timestamp: '1582435702945',
              implementation: 'Bad Hostname',
              enforced: 'Moderate',
              hsts: 'HSTS Fully Implemented',
              hstsAge: '31622400',
              preloaded: 'HSTS Preload Ready',
              negativeGuidanceTags: {
                edges: [
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim3',
                      tagName: 'DKIM-missing-O365-misconfigured',
                      guidance:
                        'DKIM record missing but MX uses O365. Follow cloud-specific guidance',
                      refLinks: [
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                      ],
                      refLinksTech: [],
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
                      tagName: 'DKIM-missing-O365-misconfigured',
                      guidance:
                        'DKIM record missing but MX uses O365. Follow cloud-specific guidance',
                      refLinks: [
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
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
                      tagId: 'dkim4',
                      tagName: 'DKIM-missing-mx-O365',
                      guidance:
                        'Government of Canada domains subject to TBS guidelines',
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
                      ],
                      refLinksTech: [
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink: '',
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
              id: 'MzE0NDA1NTgzMw==',
              timestamp: '1611109178432',
              negativeGuidanceTags: {
                edges: [
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim3',
                      tagName: 'DKIM-missing-O365-misconfigured',
                      guidance:
                        'DKIM record missing but MX uses O365. Follow cloud-specific guidance',
                      refLinks: [
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                      ],
                      refLinksTech: [],
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
                      tagName: 'DKIM-missing-O365-misconfigured',
                      guidance:
                        'DKIM record missing but MX uses O365. Follow cloud-specific guidance',
                      refLinks: [
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
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
                      tagId: 'dkim4',
                      tagName: 'DKIM-missing-mx-O365',
                      guidance:
                        'Government of Canada domains subject to TBS guidelines',
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
                      ],
                      refLinksTech: [
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink: '',
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

export const rawEmailGuidancePageData = {
  findDomainByDomain: {
    domain: 'cra-arc.gc.ca',
    lastRan: '1612170063153',
    dmarcPhase: 2,
    email: {
      dkim: {
        edges: [
          {
            cursor: 'string',
            node: {
              id: 'NjY0NjU1NjQ5OA==',
              timestamp: '1604267491498',
              results: {
                edges: [
                  {
                    cursor: 'string',
                    node: {
                      selector: 'selector1',
                      negativeGuidanceTags: {
                        edges: [
                          {
                            cursor: 'string',
                            node: {
                              tagId: 'dkim3',
                              tagName: 'DKIM-missing-O365-misconfigured',
                              guidance:
                                'DKIM record missing but MX uses O365. Follow cloud-specific guidance',
                              refLinks: [
                                {
                                  description: '3.2.2 Third Parties and DKIM',
                                  refLink:
                                    'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                                },
                              ],
                              refLinksTech: [],
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
                              tagName: 'DKIM-missing-O365-misconfigured',
                              guidance:
                                'DKIM record missing but MX uses O365. Follow cloud-specific guidance',
                              refLinks: [
                                {
                                  description: '3.2.2 Third Parties and DKIM',
                                  refLink:
                                    'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
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
                              tagId: 'dkim4',
                              tagName: 'DKIM-missing-mx-O365',
                              guidance:
                                'Government of Canada domains subject to TBS guidelines',
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
                              ],
                              refLinksTech: [
                                {
                                  description: '3.2.2 Third Parties and DKIM',
                                  refLink: '',
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
              id: 'NTE1MDUwMjM2OA==',
              timestamp: '1604648562144',
              record: 'v=DMARC1; p=none; sp=none; rua=mailto:dmarc@cyber.gc.ca',
              pPolicy: 'quarantine',
              spPolicy: 'missing',
              pct: 90,
              negativeGuidanceTags: {
                edges: [
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim3',
                      tagName: 'DKIM-missing-O365-misconfigured',
                      guidance:
                        'DKIM record missing but MX uses O365. Follow cloud-specific guidance',
                      refLinks: [
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                      ],
                      refLinksTech: [],
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
                      tagName: 'DKIM-missing-O365-misconfigured',
                      guidance:
                        'DKIM record missing but MX uses O365. Follow cloud-specific guidance',
                      refLinks: [
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
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
                      tagId: 'dkim4',
                      tagName: 'DKIM-missing-mx-O365',
                      guidance:
                        'Government of Canada domains subject to TBS guidelines',
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
                      ],
                      refLinksTech: [
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink: '',
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
              id: 'MzAxODc5NjgwOQ==',
              timestamp: '1604329339056',
              lookups: 6,
              record:
                'v=spf1 ip4:198.103.111.114/31 ip4:205.193.224.70 ip4:205.193.224.90 ip4:216.13.57.101 ip4:216.13.57.102 ip4:209.82.9.21 ip4:209.82.9.23 ip4:198.103.112.150/31 ip4:205.192.34.113 ip4:205.192.34.56 ip4:205.192.34.58 -all',
              spfDefault: 'softfail',
              negativeGuidanceTags: {
                edges: [
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim3',
                      tagName: 'DKIM-missing-O365-misconfigured',
                      guidance:
                        'DKIM record missing but MX uses O365. Follow cloud-specific guidance',
                      refLinks: [
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                      ],
                      refLinksTech: [],
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
                      tagName: 'DKIM-missing-O365-misconfigured',
                      guidance:
                        'DKIM record missing but MX uses O365. Follow cloud-specific guidance',
                      refLinks: [
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
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
                      tagId: 'dkim4',
                      tagName: 'DKIM-missing-mx-O365',
                      guidance:
                        'Government of Canada domains subject to TBS guidelines',
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
                      ],
                      refLinksTech: [
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink: '',
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
