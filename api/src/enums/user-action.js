import { GraphQLEnumType } from 'graphql'

export const UserActionEnums = new GraphQLEnumType({
  name: 'UserActionEnums',
  values: {
    CREATE: {
      value: 'create',
      description: '',
    },
    DELETE: {
      value: 'delete',
      description: '',
    },
    ADD: {
      value: 'add',
      description: '',
    },
    UPDATE: {
      value: 'update',
      description: '',
    },
    REMOVE: {
      value: 'remove',
      description: '',
    },
  },
  description: '',
})
