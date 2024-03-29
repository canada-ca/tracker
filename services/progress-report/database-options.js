const databaseOptions = ({ rootPass }) => [
  { type: 'user', username: 'root', password: rootPass },
  {
    type: 'documentcollection',
    name: 'domains',
    options: { replicationFactor: 3, writeConcern: 1, numberOfShards: 6 },
  },
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
    type: 'edgecollection',
    name: 'claims',
    options: { replicationFactor: 3, writeConcern: 1, numberOfShards: 6 },
  },
  {
    type: 'edgecollection',
    name: 'affiliations',
    options: { replicationFactor: 3, writeConcern: 1, numberOfShards: 6 },
  },
  {
    type: 'edgecollection',
    name: 'favourites',
    options: { replicationFactor: 3, writeConcern: 1, numberOfShards: 6 },
  },
  {
    type: 'edgecollection',
    name: 'ownership',
    options: { replicationFactor: 3, writeConcern: 1, numberOfShards: 6 },
  },
  {
    type: 'documentcollection',
    name: 'dmarcSummaries',
    options: { replicationFactor: 3, writeConcern: 1, numberOfShards: 6 },
  },
  {
    type: 'edgecollection',
    name: 'domainsToDmarcSummaries',
    options: { replicationFactor: 3, writeConcern: 1, numberOfShards: 6 },
  },
  {
    type: 'documentcollection',
    name: 'web',
    options: { replicationFactor: 3, writeConcern: 1, numberOfShards: 6 },
  },
  {
    type: 'documentcollection',
    name: 'webScan',
    options: { replicationFactor: 3, writeConcern: 1, numberOfShards: 6 },
  },
  {
    type: 'edgecollection',
    name: 'webToWebScans',
    options: { replicationFactor: 3, writeConcern: 1, numberOfShards: 6 },
  },
  {
    type: 'edgecollection',
    name: 'domainsWeb',
    options: { replicationFactor: 3, writeConcern: 1, numberOfShards: 6 },
  },
  {
    type: 'documentcollection',
    name: 'dns',
    options: { replicationFactor: 3, writeConcern: 1, numberOfShards: 6 },
  },
  {
    type: 'documentcollection',
    name: 'chartSummaries',
    options: { replicationFactor: 3, writeConcern: 1, numberOfShards: 6 },
  },
  {
    type: 'documentcollection',
    name: 'organizationSummaries',
    options: { replicationFactor: 3, writeConcern: 1, numberOfShards: 6 },
  },
  {
    type: 'edgecollection',
    name: 'domainsDNS',
    options: { replicationFactor: 3, writeConcern: 1, numberOfShards: 6 },
  },
]

module.exports = {
  databaseOptions,
}
