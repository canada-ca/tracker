export const rawDmarcGuidancePageData = {
  findDomainBySlug: {
    url: 'cse-cst.gc.ca',
    organization: {
      name: 'Communications Security Establishment',
    },
    slug: 'cse-cst-gc-ca',
    lastRan: '2020-07-12T17:42:15Z',
    web: {
      edges: [
        {
          cursor: 'string',
          node: {
            id: 'MTAzNTY1NTcyNw==',
            timestamp: '2020-07-12T17:42:15Z',
            domain: 'cse-cst.gc.ca',
            https: {
              httpsGuidanceTags: ['https12', 'https2', 'https7'],
            },
            ssl: {
              sslGuidanceTags: ['ssl8', 'ssl1', 'ssl3', 'ssl7'],
            },
          },
        },
        {
          cursor: 'string',
          node: {
            id: 'NzM4NDI2NzMzNw==',
            timestamp: '<DateTime>',
            domain: '<URL>',
            https: {
              httpsGuidanceTags: ['https2'],
            },
            ssl: {
              sslGuidanceTags: ['ssl1', 'ssl3', 'ssl3'],
            },
          },
        },
      ],
    },
    email: {
      edges: [
        {
          node: {
            timestamp: '2019-09-24T05:15:26Z',
            domain: 'stefanie.net',
            dmarc: {
              dmarcGuidanceTags: [],
            },
            spf: {
              spfGuidanceTags: ['spf10', 'spf8', 'spf6'],
            },
            dkim: {
              selectors: [
                {
                  selector: 'selector1._domainkey',
                  dkimGuidanceTags: ['dkim10', 'dkim4'],
                },
                {
                  selector: 'selector2._domainkey',
                  dkimGuidanceTags: ['dkim2'],
                },
                {
                  selector: 'selector2._domainkey',
                  dkimGuidanceTags: ['dkim4'],
                },
                {
                  selector: 'selector1._domainkey',
                  dkimGuidanceTags: ['dkim4', 'dkim13', 'dkim11', 'dkim2'],
                },
              ],
            },
          },
        },
        {
          node: {
            timestamp: '2020-06-29T08:12:14Z',
            domain: 'eliezer.net',
            dmarc: {
              dmarcGuidanceTags: ['dmarc11', 'dmarc15', 'dmarc18', 'dmarc9'],
            },
            spf: {
              spfGuidanceTags: ['spf3', 'spf5'],
            },
            dkim: {
              selectors: [
                {
                  selector: 'selector2._domainkey',
                  dkimGuidanceTags: ['dkim5', 'dkim12'],
                },
                {
                  selector: 'selector2._domainkey',
                  dkimGuidanceTags: ['dkim8'],
                },
                {
                  selector: 'selector2._domainkey',
                  dkimGuidanceTags: ['dkim1'],
                },
                {
                  selector: 'selector2._domainkey',
                  dkimGuidanceTags: ['dkim10', 'dkim5', 'dkim3', 'dkim11'],
                },
              ],
            },
          },
        },
      ],
    },
  },
}
