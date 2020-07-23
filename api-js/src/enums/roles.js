const { GraphQLEnumType } = require('graphql')

module.exports.RoleEnums = new GraphQLEnumType({
  name: 'RoleEnums',
  values: {
    USER_READ: {
      value: 'user_read',
      description: 'A user who has been given access to view results.',
    },
    USER_WRITE: {
      value: 'user_write',
      description:
        'A user who has been given access to run scans, and manage domains.',
    },
    ADMIN: {
      value: 'admin',
      description:
        'A user who has the same access as a user write account, but can define new user read/write accounts.',
    },
    SUPER_ADMIN: {
      value: 'super_admin',
      description:
        'A user who has the same access as an admin, but can define new admins.',
    },
  },
  description: 'An enum used to assign, and test users roles.',
})
