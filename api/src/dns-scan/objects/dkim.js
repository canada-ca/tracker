import {GraphQLList, GraphQLObjectType, GraphQLString} from 'graphql'
import { connectionArgs, globalIdField } from 'graphql-relay'
import { GraphQLDate } from 'graphql-scalars'

import { dkimResultConnection } from './dkim-result-connection'
import { dkimResultOrder } from '../inputs'
import { domainType } from '../../domain/objects'
import { nodeInterface } from '../../node'
import {dkimSelectorResultType} from "./dkim-selector-result";

export const dkimType = new GraphQLObjectType({
  name: 'DKIM',
  fields: () => ({
    status: {
      type: GraphQLString,
      description: `The compliance status for DKIM for the scanned domain.`,
      resolve: async ({status}) => status
    },
    selectors: {
      type: GraphQLList(dkimSelectorResultType),
      description: 'Individual scans results for each DKIM selector.',
      resolve: async ({selectors}) => {
        const selectorArray = []
        for (const selector in selectors) {
          selectorArray.push({
            selector: selector,
            ...selectors[selector]
          })
        }
        return selectorArray
      },
    },
  }),
  description: `DomainKeys Identified Mail (DKIM) permits a person, role, or
organization that owns the signing domain to claim some
responsibility for a message by associating the domain with the
message.  This can be an author's organization, an operational relay,
or one of their agents.`,
})
