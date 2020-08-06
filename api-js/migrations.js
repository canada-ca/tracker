const makeMigrations = ({ databaseName, rootPass }) => [
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
    type: 'edgecollection',
    databaseName,
    name: 'affiliations',
  },
  {
    type: 'edgecollection',
    databaseName,
    name: 'ownership',
  },
]

module.exports = {
  makeMigrations,
}
