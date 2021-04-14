export const makeMigrations = ({ databaseName, rootPass }) => [
    {
      type: 'database',
      databaseName,
      users: [{ username: 'root', passwd: rootPass }],
    },
    {
      type: 'documentcollection',
      databaseName,
      name: 'users',
    },
    {
      type: 'documentcollection',
      databaseName,
      name: 'organizations',
    },
    {
      type: 'documentcollection',
      databaseName,
      name: 'domains',
    },
    {
      type: 'documentcollection',
      databaseName,
      name: 'dkim',
    },
    {
      type: 'documentcollection',
      databaseName,
      name: 'dkimResults',
    },
    {
      type: 'documentcollection',
      databaseName,
      name: 'dmarc',
    },
    {
      type: 'documentcollection',
      databaseName,
      name: 'spf',
    },
    {
      type: 'documentcollection',
      databaseName,
      name: 'https',
    },
    {
      type: 'documentcollection',
      databaseName,
      name: 'ssl',
    },
    {
      type: 'documentcollection',
      databaseName,
      name: 'dkimGuidanceTags',
    },
    {
      type: 'documentcollection',
      databaseName,
      name: 'dmarcGuidanceTags',
    },
    {
      type: 'documentcollection',
      databaseName,
      name: 'spfGuidanceTags',
    },
    {
      type: 'documentcollection',
      databaseName,
      name: 'httpsGuidanceTags',
    },
    {
      type: 'documentcollection',
      databaseName,
      name: 'sslGuidanceTags',
    },
    {
      type: 'documentcollection',
      databaseName,
      name: 'chartSummaries',
    },
    {
      type: 'documentcollection',
      databaseName,
      name: 'dmarcSummaries',
    },
    {
      type: 'edgecollection',
      databaseName,
      name: 'affiliations',
    },
    {
      type: 'edgecollection',
      databaseName,
      name: 'claims',
    },
    {
      type: 'edgecollection',
      databaseName,
      name: 'domainsDKIM',
    },
    {
      type: 'edgecollection',
      databaseName,
      name: 'dkimToDkimResults',
    },
    {
      type: 'edgecollection',
      databaseName,
      name: 'domainsDMARC',
    },
    {
      type: 'edgecollection',
      databaseName,
      name: 'domainsSPF',
    },
    {
      type: 'edgecollection',
      databaseName,
      name: 'domainsHTTPS',
    },
    {
      type: 'edgecollection',
      databaseName,
      name: 'domainsSSL',
    },
    {
      type: 'edgecollection',
      databaseName,
      name: 'ownership',
    },
    {
      type: 'edgecollection',
      databaseName,
      name: 'domainsToDmarcSummaries',
    },
  ]
  
  module.exports = {
    makeMigrations,
  }