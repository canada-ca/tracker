import {GraphQLEnumType} from 'graphql'

export const OrderDirection = new GraphQLEnumType({
  name: 'OrderDirection',
  values: {
    ASC: {
      value: 'ASC',
      description:
        'Specifies an ascending order for a given `orderBy` argument.',
    },
    DESC: {
      value: 'DESC',
      description:
        'Specifies a descending order for a given `orderBy` argument.',
    },
  },
  description:
    'Possible directions in which to order a list of items when provided an `orderBy` argument.',
})
