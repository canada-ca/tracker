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
            },
          },
        ],
      },
      ssl: {
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
    lastRan: '1615384085361',
    dmarcPhase: 2,
    email: {
      dkim: {
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
            },
          },
        ],
      },
      dmarc: {
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
                          description: '3.2.2 Third Parties and DKIM',
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
            },
          },
        ],
      },
      spf: {
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
            },
          },
        ],
      },
    },
  },
}
