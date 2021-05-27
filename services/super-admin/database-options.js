const databaseOptions = ({ rootPass }) => [
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
    type: 'edgecollection',
    name: 'affiliations',
    options: { replicationFactor: 3, writeConcern: 1, numberOfShards: 6 },
  },
]

module.exports = {
  databaseOptions,
}
