import { GraphQLEnumType } from 'graphql'

export const DkimResultOrderField = new GraphQLEnumType({
  name: 'DKIMResultOrderField',
  description: 'Properties by which DKIM Result connections can be ordered.',
  values: {
    SELECTOR: {
      value: 'selector',
      description: 'Order DKIM Result edges by timestamp.',
    },
    RECORD: {
      vale: 'record',
      description: 'Order DKIM Result edges by record.',
    },
    KEY_LENGTH: {
      value: 'key-length',
      description: 'Order DKIM Result edges by key length.',
    },
  },
})
