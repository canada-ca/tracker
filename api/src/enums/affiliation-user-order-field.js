import {GraphQLEnumType} from 'graphql'

export const AffiliationUserOrderField = new GraphQLEnumType({
  name: 'AffiliationUserOrderField',
  description: 'Properties by which affiliation connections can be ordered.',
  values: {
    USER_USERNAME: {
      value: 'user-username',
      description: 'Order affiliation edges by username.',
    },
    USER_DISPLAYNAME: {
      value: 'user-displayName',
      description: 'Order affiliation edges by displayName',
    },
    USER_EMAIL_VALIDATED: {
      value: 'user-emailValidated',
      description: 'Order affiliation edges by user verification status',
    },
    USER_AFFILIATIONS_COUNT: {
      value: 'user-affiliations-totalCount',
      description: 'Order affiliation edges by amount of total affiliations',
    },
  },
})
