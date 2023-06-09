import { GraphQLEnumType } from 'graphql'

export const InvitationRoleEnums = new GraphQLEnumType({
  name: 'InvitationRoleEnums',
  values: {
    USER: {
      value: 'user',
      description: 'A user who has been given access to view an organization.',
    },
    ADMIN: {
      value: 'admin',
      description:
        'A user who has the same access as a user write account, but can define new user read/write accounts.',
    },
    SUPER_ADMIN: {
      value: 'super_admin',
      description: 'A user who has the same access as an admin, but can define new admins.',
    },
  },
  description: 'An enum used when inviting users to an organization to assign their role.',
})
