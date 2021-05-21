export const databaseOptions = ({ rootPass }) => [
  { type: 'user', username: 'root', password: rootPass },
  {
    type: 'documentcollection',
    name: 'users',
    options: { replicationFactor: 3, writeConcern: 1, numberOfShards: 6 },
  },
  {
    type: 'documentcollection',
    name: 'organizations',
    options: { replicationFactor: 3, writeConcern: 1, numberOfShards: 6 },
  },
  {
    type: 'documentcollection',
    name: 'domains',
    options: { replicationFactor: 3, writeConcern: 1, numberOfShards: 6 },
  },
  {
    type: 'documentcollection',
    name: 'dkim',
    options: { replicationFactor: 3, writeConcern: 1, numberOfShards: 6 },
  },
  {
    type: 'documentcollection',
    name: 'dkimResults',
    options: { replicationFactor: 3, writeConcern: 1, numberOfShards: 6 },
  },
  {
    type: 'documentcollection',
    name: 'dmarc',
    options: { replicationFactor: 3, writeConcern: 1, numberOfShards: 6 },
  },
  {
    type: 'documentcollection',
    name: 'spf',
    options: { replicationFactor: 3, writeConcern: 1, numberOfShards: 6 },
  },
  {
    type: 'documentcollection',
    name: 'https',
    options: { replicationFactor: 3, writeConcern: 1, numberOfShards: 6 },
  },
  {
    type: 'documentcollection',
    name: 'ssl',
    options: { replicationFactor: 3, writeConcern: 1, numberOfShards: 6 },
  },
  {
    type: 'documentcollection',
    name: 'dkimGuidanceTags',
    options: { replicationFactor: 3, writeConcern: 1, numberOfShards: 6 },
  },
  {
    type: 'documentcollection',
    name: 'dmarcGuidanceTags',
    options: { replicationFactor: 3, writeConcern: 1, numberOfShards: 6 },
  },
  {
    type: 'documentcollection',
    name: 'spfGuidanceTags',
    options: { replicationFactor: 3, writeConcern: 1, numberOfShards: 6 },
  },
  {
    type: 'documentcollection',
    name: 'httpsGuidanceTags',
    options: { replicationFactor: 3, writeConcern: 1, numberOfShards: 6 },
  },
  {
    type: 'documentcollection',
    name: 'sslGuidanceTags',
    options: { replicationFactor: 3, writeConcern: 1, numberOfShards: 6 },
  },
  {
    type: 'documentcollection',
    name: 'chartSummaries',
    options: { replicationFactor: 3, writeConcern: 1, numberOfShards: 6 },
  },
  {
    type: 'documentcollection',
    name: 'dmarcSummaries',
    options: { replicationFactor: 3, writeConcern: 1, numberOfShards: 6 },
  },
  {
    type: 'documentcollection',
    name: 'aggregateGuidanceTags',
    options: { replicationFactor: 3, writeConcern: 1, numberOfShards: 6 },
  },
  {
    type: 'documentcollection',
    name: 'scanSummaryCriteria',
    options: { replicationFactor: 3, writeConcern: 1, numberOfShards: 6 },
  },
  {
    type: 'documentcollection',
    name: 'chartSummaryCriteria',
    options: { replicationfactor: 3, writeconcern: 1, numberofshards: 6 },
  },
  {
    type: 'documentcollection',
    name: 'scanSummaries',
    options: { replicationfactor: 3, writeconcern: 1, numberofshards: 6 },
  },
  {
    type: 'edgecollection',
    name: 'affiliations',
    options: { replicationFactor: 3, writeConcern: 1, numberOfShards: 6 },
  },
  {
    type: 'edgecollection',
    name: 'claims',
    options: { replicationFactor: 3, writeConcern: 1, numberOfShards: 6 },
  },
  {
    type: 'edgecollection',
    name: 'domainsDKIM',
    options: { replicationFactor: 3, writeConcern: 1, numberOfShards: 6 },
  },
  {
    type: 'edgecollection',
    name: 'dkimToDkimResults',
    options: { replicationFactor: 3, writeConcern: 1, numberOfShards: 6 },
  },
  {
    type: 'edgecollection',
    name: 'domainsDMARC',
    options: { replicationFactor: 3, writeConcern: 1, numberOfShards: 6 },
  },
  {
    type: 'edgecollection',
    name: 'domainsSPF',
    options: { replicationFactor: 3, writeConcern: 1, numberOfShards: 6 },
  },
  {
    type: 'edgecollection',
    name: 'domainsHTTPS',
    options: { replicationFactor: 3, writeConcern: 1, numberOfShards: 6 },
  },
  {
    type: 'edgecollection',
    name: 'domainsSSL',
    options: { replicationFactor: 3, writeConcern: 1, numberOfShards: 6 },
  },
  {
    type: 'edgecollection',
    name: 'ownership',
    options: { replicationFactor: 3, writeConcern: 1, numberOfShards: 6 },
  },
  {
    type: 'edgecollection',
    name: 'domainsToDmarcSummaries',
    options: { replicationFactor: 3, writeConcern: 1, numberOfShards: 6 },
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
