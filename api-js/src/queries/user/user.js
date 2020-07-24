const { EmailAddress } = require('../../scalars')
const { userType } = require('../../types')

const user = {
  type: userType,
  args: {
    userName: {
      type: EmailAddress,
      description: 'Email address of user you wish to gather data for.',
    },
  },
  description:
    'Query the currently logged in user if no user name is given, or query a specific user by user name.',
  resolve: async () => {},
}

module.exports = {
  user,
}
