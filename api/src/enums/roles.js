import { GraphQLEnumType } from 'graphql'

export const RoleEnums = new GraphQLEnumType({
  name: 'RoleEnums',
  values: {
    PENDING: {
      value: 'pending',
      description: 'A user who has requested an invite to an organization.',
    },
    USER: {
      value: 'user',
      description: 'A user who has been given access to view an organization.',
    },
    ADMIN: {
      value: 'admin',
      description:
        'A user who has the same access as a user write account, but can define new user read/write accounts.',
    },
    OWNER: {
      value: 'owner',
      description:
        'A user who has the same access as an admin, but can define new admins, and delete the organization.',
    },
    SUPER_ADMIN: {
      value: 'super_admin',
      description: 'A user who has the same access as an admin, but can define new admins.',
    },
    SERVICE: {
      value: 'service',
      description: 'An internal service used by Tracker to make changes to organizational data.',
    },
  },
  description: 'An enum used to assign, and test users roles.',
})
