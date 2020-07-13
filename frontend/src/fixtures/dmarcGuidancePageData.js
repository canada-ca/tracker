export const rawDmarcGuidancePageData = {
  findDomainBySlug: {
    url: 'cse-cst.gc.ca',
    slug: '<Slug>',
    lastRan: '2020-07-12T17:42:15Z',
    web: {
      edges: [
        {
          cursor: 'string',
          node: {
            id: 'MTAzNTY1NTcyNw==',
            timestamp: '<DateTime>',
            domain: '<URL>',
            https: {
              httpsGuidanceTags: ['https12', 'https2', 'https7'],
              __typename: 'HTTPS',
            },
            ssl: {
              sslGuidanceTags: ['ssl8', 'ssl1', 'ssl3', 'ssl7'],
              __typename: 'SSL',
            },
            __typename: 'WebScan',
          },
          __typename: 'WebScanEdge',
        },
        {
          cursor: 'string',
          node: {
            id: 'NzM4NDI2NzMzNw==',
            timestamp: '<DateTime>',
            domain: '<URL>',
            https: {
              httpsGuidanceTags: ['https2'],
              __typename: 'HTTPS',
            },
            ssl: {
              sslGuidanceTags: ['ssl1', 'ssl3', 'ssl3'],
              __typename: 'SSL',
            },
            __typename: 'WebScan',
          },
          __typename: 'WebScanEdge',
        },
      ],
      __typename: 'WebScanConnection',
    },
    email: {
      edges: [
        {
          node: {
            timestamp: '2019-09-24T05:15:26Z',
            domain: 'stefanie.net',
            dmarc: {
              dmarcGuidanceTags: [],
              __typename: 'DMARC',
            },
            spf: {
              spfGuidanceTags: ['spf10', 'spf8', 'spf6'],
              __typename: 'SPF',
            },
            dkim: {
              selectors: [
                {
                  selector: 'selector1._domainkey',
                  dkimGuidanceTags: ['dkim10', 'dkim4'],
                  __typename: 'DkimSelectors',
                },
                {
                  selector: 'selector2._domainkey',
                  dkimGuidanceTags: ['dkim2'],
                  __typename: 'DkimSelectors',
                },
                {
                  selector: 'selector2._domainkey',
                  dkimGuidanceTags: ['dkim4'],
                  __typename: 'DkimSelectors',
                },
                {
                  selector: 'selector1._domainkey',
                  dkimGuidanceTags: ['dkim4', 'dkim13', 'dkim11', 'dkim2'],
                  __typename: 'DkimSelectors',
                },
              ],
              __typename: 'DKIM',
            },
            __typename: 'MailScan',
          },
          __typename: 'MailScanEdge',
        },
        {
          node: {
            timestamp: '2020-06-29T08:12:14Z',
            domain: 'eliezer.net',
            dmarc: {
              dmarcGuidanceTags: ['dmarc11', 'dmarc15', 'dmarc18', 'dmarc9'],
              __typename: 'DMARC',
            },
            spf: {
              spfGuidanceTags: ['spf3', 'spf5'],
              __typename: 'SPF',
            },
            dkim: {
              selectors: [
                {
                  selector: 'selector2._domainkey',
                  dkimGuidanceTags: ['dkim5', 'dkim12'],
                  __typename: 'DkimSelectors',
                },
                {
                  selector: 'selector2._domainkey',
                  dkimGuidanceTags: ['dkim8'],
                  __typename: 'DkimSelectors',
                },
                {
                  selector: 'selector2._domainkey',
                  dkimGuidanceTags: ['dkim1'],
                  __typename: 'DkimSelectors',
                },
                {
                  selector: 'selector2._domainkey',
                  dkimGuidanceTags: ['dkim10', 'dkim5', 'dkim3', 'dkim11'],
                  __typename: 'DkimSelectors',
                },
              ],
              __typename: 'DKIM',
            },
            __typename: 'MailScan',
          },
          __typename: 'MailScanEdge',
        },
      ],
      __typename: 'MailScanConnection',
    },
    __typename: 'Domain',
  },
}
