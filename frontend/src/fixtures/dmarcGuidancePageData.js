export const rawDmarcGuidancePageData = {
  findDomainByDomain: {
    domain: 'cra-arc.gc.ca',
    lastRan: '1612170063153',
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
              guidanceTags: {
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
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                        },
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
                      tagId: 'dkim2',
                      tagName: 'DKIM-GC',
                      guidance:
                        'Government of Canada domains subject to TBS guidelines',
                      refLinks: [],
                      refLinksTech: [],
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
              guidanceTags: {
                edges: [
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim3',
                      tagName: 'DKIM-missing',
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
                      tagId: 'dkim2',
                      tagName: 'DKIM-GC',
                      guidance:
                        'Government of Canada domains subject to TBS guidelines',
                      refLinks: [
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                        {
                          description: 'IT PIN',
                          refLink: '',
                        },
                        {
                          description: 'IT PIN',
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
                          description: '3.2.2 Third Parties and DKIM',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                        },
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
          {
            cursor: 'string',
            node: {
              id: 'Nzk3Njg2ODk3Ng==',
              timestamp: '1607591973064',
              guidanceTags: {
                edges: [
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim4',
                      tagName: 'DKIM-GC',
                      guidance:
                        'Government of Canada domains subject to TBS guidelines',
                      refLinks: [
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
                      tagName: 'DKIM-GC',
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
                      tagId: 'dkim2',
                      tagName: 'DKIM-GC',
                      guidance:
                        'DKIM record missing but MX uses O365. Follow cloud-specific guidance',
                      refLinks: [],
                      refLinksTech: [],
                    },
                  },
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
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink: '',
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
                ],
              },
            },
          },
          {
            cursor: 'string',
            node: {
              id: 'MTM0ODgzNjk1',
              timestamp: '1587662956086',
              guidanceTags: {
                edges: [
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
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
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
                      ],
                    },
                  },
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim1',
                      tagName: 'DKIM-GC',
                      guidance:
                        'DKIM record missing but MX uses O365. Follow cloud-specific guidance',
                      refLinks: [
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
                          refLink: '',
                        },
                      ],
                      refLinksTech: [],
                    },
                  },
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim3',
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
                      tagId: 'dkim1',
                      tagName: 'DKIM-missing-O365-misconfigured',
                      guidance: 'Follow implementation guide',
                      refLinks: [],
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
                      tagId: 'dkim4',
                      tagName: 'DKIM-missing',
                      guidance:
                        'Government of Canada domains subject to TBS guidelines',
                      refLinks: [
                        {
                          description: 'IT PIN',
                          refLink: '',
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
          {
            cursor: 'string',
            node: {
              id: 'NDUyMzY3NzYwOQ==',
              timestamp: '1600891981749',
              guidanceTags: {
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
                          description: '3.2.2 Third Parties and DKIM',
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
                    },
                  },
                ],
              },
            },
          },
          {
            cursor: 'string',
            node: {
              id: 'NjY5NDYyNTMwNA==',
              timestamp: '1589692481278',
              guidanceTags: {
                edges: [
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim4',
                      tagName: 'DKIM-GC',
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
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
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
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim3',
                      tagName: 'DKIM-missing-O365-misconfigured',
                      guidance:
                        'DKIM CNAMEs do not exist, but MX points to *.onmicrosoft.com and SPF record includes O365.',
                      refLinks: [
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
                      refLinksTech: [
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
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
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
                      tagId: 'dkim2',
                      tagName: 'DKIM-missing-O365-misconfigured',
                      guidance:
                        'DKIM CNAMEs do not exist, but MX points to *.onmicrosoft.com and SPF record includes O365.',
                      refLinks: [
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
                      guidanceTags: {
                        edges: [
                          {
                            cursor: 'string',
                            node: {
                              tagId: 'dkim3',
                              tagName: 'DKIM-GC',
                              guidance: 'Follow implementation guide',
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
                                  refLink: '',
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
                              ],
                            },
                          },
                          {
                            cursor: 'string',
                            node: {
                              tagId: 'dkim4',
                              tagName: 'DKIM-missing',
                              guidance:
                                'Government of Canada domains subject to TBS guidelines',
                              refLinks: [
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
                                'DKIM CNAMEs do not exist, but MX points to *.onmicrosoft.com and SPF record includes O365.',
                              refLinks: [],
                              refLinksTech: [],
                            },
                          },
                          {
                            cursor: 'string',
                            node: {
                              tagId: 'dkim3',
                              tagName: 'DKIM-missing',
                              guidance: 'Follow implementation guide',
                              refLinks: [],
                              refLinksTech: [
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
                    },
                  },
                  {
                    cursor: 'string',
                    node: {
                      selector: 'selector2',
                      guidanceTags: {
                        edges: [
                          {
                            cursor: 'string',
                            node: {
                              tagId: 'dkim3',
                              tagName: 'DKIM-missing-O365-misconfigured',
                              guidance: 'Follow implementation guide',
                              refLinks: [
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
                              refLinks: [],
                              refLinksTech: [
                                {
                                  description: '3.2.2 Third Parties and DKIM',
                                  refLink: '',
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
                              ],
                            },
                          },
                          {
                            cursor: 'string',
                            node: {
                              tagId: 'dkim1',
                              tagName: 'DKIM-missing',
                              guidance: 'Follow implementation guide',
                              refLinks: [
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
                                  description: 'IT PIN',
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
              dmarcPhase: 2,
              record: 'v=DMARC1; p=none; sp=none; rua=mailto:dmarc@cyber.gc.ca',
              pPolicy: 'quarantine',
              spPolicy: 'missing',
              pct: 90,
              guidanceTags: {
                edges: [
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim1',
                      tagName: 'DKIM-missing',
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
              id: 'MTE5OTMxNjgwMQ==',
              timestamp: '1586900265661',
              dmarcPhase: 3,
              record:
                'v=DMARC1; p=none; pct=100; rua=mailto:dmarc@cyber.gc.ca; ruf=mailto:dmarc@cyber.gc.ca; fo=1',
              pPolicy: 'quarantine',
              spPolicy: 'none',
              pct: 20,
              guidanceTags: {
                edges: [
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim4',
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
                      refLinksTech: [],
                    },
                  },
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim2',
                      tagName: 'DKIM-missing-O365-misconfigured',
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
                          description: 'IT PIN',
                          refLink: '',
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
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim3',
                      tagName: 'DKIM-missing',
                      guidance: 'Follow implementation guide',
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
                      ],
                    },
                  },
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
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
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
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                        },
                        {
                          description: 'IT PIN',
                          refLink: '',
                        },
                        {
                          description: 'IT PIN',
                          refLink: '',
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
              id: 'MTQwODcwMzU1Mw==',
              timestamp: '1590181119745',
              dmarcPhase: 1,
              record:
                'v=DMARC1; p=none; pct=100; rua=mailto:dmarc@cyber.gc.ca; ruf=mailto:dmarc@cyber.gc.ca; fo=1',
              pPolicy: 'reject',
              spPolicy: 'none',
              pct: 60,
              guidanceTags: {
                edges: [
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim3',
                      tagName: 'DKIM-GC',
                      guidance:
                        'DKIM CNAMEs do not exist, but MX points to *.onmicrosoft.com and SPF record includes O365.',
                      refLinks: [
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
                          description: '3.2.2 Third Parties and DKIM',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
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
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
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
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
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
              id: 'NDA5ODQzNTYzMQ==',
              timestamp: '1608755757585',
              dmarcPhase: 1,
              record:
                'v=DMARC1; p=none; pct=100; rua=mailto:dmarc@cyber.gc.ca; ruf=mailto:dmarc@cyber.gc.ca; fo=1',
              pPolicy: 'reject',
              spPolicy: 'missing',
              pct: 0,
              guidanceTags: {
                edges: [
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim1',
                      tagName: 'DKIM-missing-mx-O365',
                      guidance: 'Follow implementation guide',
                      refLinks: [
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
                          description: 'IT PIN',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
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
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
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
                      tagId: 'dkim2',
                      tagName: 'DKIM-missing-mx-O365',
                      guidance:
                        'Government of Canada domains subject to TBS guidelines',
                      refLinks: [],
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
                      tagId: 'dkim1',
                      tagName: 'DKIM-missing-mx-O365',
                      guidance:
                        'DKIM CNAMEs do not exist, but MX points to *.onmicrosoft.com and SPF record includes O365.',
                      refLinks: [
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
                          description: '3.2.2 Third Parties and DKIM',
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
                      tagId: 'dkim2',
                      tagName: 'DKIM-missing-mx-O365',
                      guidance:
                        'DKIM record missing but MX uses O365. Follow cloud-specific guidance',
                      refLinks: [],
                      refLinksTech: [],
                    },
                  },
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
              guidanceTags: {
                edges: [
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim2',
                      tagName: 'DKIM-missing-mx-O365',
                      guidance:
                        'DKIM CNAMEs do not exist, but MX points to *.onmicrosoft.com and SPF record includes O365.',
                      refLinks: [
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
                          description: 'IT PIN',
                          refLink: '',
                        },
                        {
                          description: 'IT PIN',
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
              id: 'MzY0MjcyMDE3NA==',
              timestamp: '1581411201322',
              lookups: 5,
              record:
                'v=spf1 ip4:40.92.0.0/15 ip4:40.107.0.0/16 ip4:52.100.0.0/14 ip4:104.47.0.0/17 ip6:2a01:111:f400::/48 ip6:2a01:111:f403::/48 -all',
              spfDefault: 'softfail',
              guidanceTags: {
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
                          refLink: '',
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
                        'Government of Canada domains subject to TBS guidelines',
                      refLinks: [
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
                          refLink: '',
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
                      tagName: 'DKIM-missing-O365-misconfigured',
                      guidance:
                        'DKIM record missing but MX uses O365. Follow cloud-specific guidance',
                      refLinks: [],
                      refLinksTech: [],
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
