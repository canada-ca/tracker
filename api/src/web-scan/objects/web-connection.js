import { GraphQLInt } from 'graphql'
import { connectionDefinitions } from 'graphql-relay'

import {webType} from "./web";

export const webConnection = connectionDefinitions({
  name: 'Web',
  nodeType: webType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of web scans related to a given domain.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})
