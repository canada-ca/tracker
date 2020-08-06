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
    name: 'organizationsEN',
  },
  {
    type: 'documentcollection',
    databaseName,
    name: 'organizationsFR',
  },
  {
    type: 'documentcollection',
    databaseName,
    name: 'organizationsLookup',
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
    name: 'claims',
  },
]

module.exports = {
  makeMigrations,
}
