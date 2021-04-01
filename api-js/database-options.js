export const databaseOptions = ({ rootPass }) => [
  { type: 'user', username: 'root', password: rootPass },
  {
    type: 'documentcollection',
    name: 'users',
  },
  {
    type: 'documentcollection',
    name: 'organizations',
  },
  {
    type: 'documentcollection',
    name: 'domains',
  },
  {
    type: 'documentcollection',
    name: 'dkim',
  },
  {
    type: 'documentcollection',
    name: 'dkimResults',
  },
  {
    type: 'documentcollection',
    name: 'dmarc',
  },
  {
    type: 'documentcollection',
    name: 'spf',
  },
  {
    type: 'documentcollection',
    name: 'https',
  },
  {
    type: 'documentcollection',
    name: 'ssl',
  },
  {
    type: 'documentcollection',
    name: 'dkimGuidanceTags',
  },
  {
    type: 'documentcollection',
    name: 'dmarcGuidanceTags',
  },
  {
    type: 'documentcollection',
    name: 'spfGuidanceTags',
  },
  {
    type: 'documentcollection',
    name: 'httpsGuidanceTags',
  },
  {
    type: 'documentcollection',
    name: 'sslGuidanceTags',
  },
  {
    type: 'documentcollection',
    name: 'chartSummaries',
  },
  {
    type: 'documentcollection',
    name: 'dmarcSummaries',
  },
  {
    type: 'edgecollection',
    name: 'affiliations',
  },
  {
    type: 'edgecollection',
    name: 'claims',
  },
  {
    type: 'edgecollection',
    name: 'domainsDKIM',
  },
  {
    type: 'edgecollection',
    name: 'dkimToDkimResults',
  },
  {
    type: 'edgecollection',
    name: 'domainsDMARC',
  },
  {
    type: 'edgecollection',
    name: 'domainsSPF',
  },
  {
    type: 'edgecollection',
    name: 'domainsHTTPS',
  },
  {
    type: 'edgecollection',
    name: 'domainsSSL',
  },
  {
    type: 'edgecollection',
    name: 'ownership',
  },
  {
    type: 'edgecollection',
    name: 'domainsToDmarcSummaries',
  },
  {
    type: 'delimiteranalyzer',
    name: 'space-delimiter-analyzer',
    delimiter: ' ',
  },
  {
    type: 'searchview',
    name: 'domainSearch',
    options: {
      links: {
        domains: {
          fields: {
            domain: { analyzers: ['space-delimiter-analyzer'] },
          },
        },
      },
    },
  },
  {
    type: 'searchview',
    name: 'organizationSearch',
    options: {
      links: {
        organizations: {
          fields: {
            orgDetails: {
              fields: {
                en: {
                  fields: {
                    acronym: { analyzers: ['text_en'] },
                    name: { analyzers: ['text_en'] },
                  },
                },
                fr: {
                  fields: {
                    acronym: { analyzers: ['text_en'] },
                    name: { analyzers: ['text_en'] },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
]
