const databaseOptions = ({ rootPass }) => [
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
    type: 'edgecollection',
    name: 'affiliations',
  },
]

module.exports = {
  databaseOptions,
}
