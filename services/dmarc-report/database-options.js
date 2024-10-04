const databaseOptions = ({ rootPass }) => [
  { type: 'user', username: 'root', password: rootPass },
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
    name: 'dmarcSummaries',
    options: { replicationFactor: 3, writeConcern: 1, numberOfShards: 6 },
  },
  {
    type: 'edgecollection',
    name: 'claims',
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
]

module.exports = {
  databaseOptions,
}
