import { GraphQLEnumType } from 'graphql'

export const TfaSendMethodEnum = new GraphQLEnumType({
  name: 'TFASendMethodEnum',
  values: {
    EMAIL: {
      value: 'email',
      description:
        'Used for defining that the TFA code will be sent via email.',
    },
    PHONE: {
      value: 'phone',
      description: 'Used for defining that the TFA code will be sent via text.',
    },
    NONE: {
      value: 'none',
      description: 'User has not setup any TFA methods.',
    },
  },
})
