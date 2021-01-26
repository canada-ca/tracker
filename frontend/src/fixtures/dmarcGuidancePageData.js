export const rawDmarcGuidancePageData = {
  findDomainByDomain: {
    domain: 'cyber.gc.ca',
    lastRan: '1611085569186',
    web: {
      https: {
        edges: [
          {
            cursor: 'string',
            node: {
              id: 'NjAzNjA0Mzk0Nw==',
              timestamp: '1598269163774',
              guidanceTags: {
                edges: [
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim4',
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
                      refLinksTech: [
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
                          description: '3.2.2 Third Parties and DKIM',
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
                        },
                        {
                          description: '3.2.2 Third Parties and DKIM',
                          refLink: '',
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
                          description: '3.2.2 Third Parties and DKIM',
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
                          refLink: '',
                        },
                        {
                          description: '3.2.2 Third Parties and DKIM',
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
                      tagName: 'DKIM-GC',
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
                          refLink: '',
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
                      ],
                    },
                  },
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim4',
                      tagName: 'DKIM-missing-O365-misconfigured',
                      guidance:
                        'Government of Canada domains subject to TBS guidelines',
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
                      tagId: 'dkim4',
                      tagName: 'DKIM-missing',
                      guidance:
                        'Government of Canada domains subject to TBS guidelines',
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
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34',
                        },
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
                      ],
                      refLinksTech: [
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
              id: 'Njc2MjA3MzQyOA==',
              timestamp: '1587194794166',
              guidanceTags: {
                edges: [],
              },
            },
          },
          {
            cursor: 'string',
            node: {
              id: 'MzgzOTA2NjE1NA==',
              timestamp: '1603365231696',
              guidanceTags: {
                edges: [
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim2',
                      tagName: 'DKIM-missing-mx-O365',
                      guidance:
                        'DKIM record missing but MX uses O365. Follow cloud-specific guidance',
                      refLinks: [
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
                        {
                          description: '3.2.2 Third Parties and DKIM',
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
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
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
                      tagName: 'DKIM-missing-mx-O365',
                      guidance: 'Follow implementation guide',
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
              id: 'Njc0NTE3NDM3OA==',
              timestamp: '1583135974795',
              guidanceTags: {
                edges: [
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim1',
                      tagName: 'DKIM-missing-mx-O365',
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
                      ],
                    },
                  },
                  {
                    cursor: 'string',
                    node: {
                      tagId: 'dkim4',
                      tagName: 'DKIM-missing-O365-misconfigured',
                      guidance:
                        'Government of Canada domains subject to TBS guidelines',
                      refLinks: [],
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
    email: {
      dkim: {
        edges: [
          {
            cursor: 'string',
            node: {
              id: 'Mzc0NzMyOTI1Mw==',
              timestamp: '1608382741150',
              results: {
                edges: [
                  {
                    cursor: 'string',
                    node: {
                      selector: 'selector2',
                      guidanceTags: {
                        edges: [],
                      },
                    },
                  },
                ],
              },
            },
          },
          {
            cursor: 'string',
            node: {
              id: 'MzcxMjAyODI1NQ==',
              timestamp: '1591348425643',
              results: {
                edges: [
                  {
                    cursor: 'string',
                    node: {
                      selector: 'selector3',
                      guidanceTags: {
                        edges: [],
                      },
                    },
                  },
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
                              tagName: 'DKIM-missing-O365-misconfigured',
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
                ],
              },
            },
          },
          {
            cursor: 'string',
            node: {
              id: 'OTczMjA5NDU2Mw==',
              timestamp: '1592527827386',
              results: {
                edges: [
                  {
                    cursor: 'string',
                    node: {
                      selector: 'selector1',
                      guidanceTags: {
                        edges: [],
                      },
                    },
                  },
                ],
              },
            },
          },
          {
            cursor: 'string',
            node: {
              id: 'OTk2MTQ4NDMzNw==',
              timestamp: '1595908191351',
              results: {
                edges: [],
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
              id: 'NjA1MDUxNjIzNA==',
              timestamp: '1593375240524',
              guidanceTags: {
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
                          refLink:
                            'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322',
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
                      tagId: 'dkim2',
                      tagName: 'DKIM-missing',
                      guidance:
                        'Government of Canada domains subject to TBS guidelines',
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
                      tagId: 'dkim4',
                      tagName: 'DKIM-missing-O365-misconfigured',
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
                      tagName: 'DKIM-missing-O365-misconfigured',
                      guidance: 'Follow implementation guide',
                      refLinks: [
                        {
                          description:
                            'A.3.4 Deploy DKIM for All Domains and senders',
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
                      refLinksTech: [],
                    },
                  },
                ],
              },
            },
          },
        ],
      },
      spf: {
        edges: [],
      },
    },
  },
}
