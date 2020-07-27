const makeMigrations = ({ databaseName, rootPass }) => [
  {
    type: 'database',
    databaseName,
    users: [{ username: 'root', passwd: rootPass }]
  },
  {
    type: 'documentcollection',
    databaseName,
    name: 'users'
  }
]

module.exports = {
  makeMigrations
}
