import { GraphQLObjectType } from 'graphql'
import { connectionArgs } from 'graphql-relay'

import { dkimFailureConnection } from './dkim-failure-table'
import { dmarcFailureConnection } from './dmarc-failure-table'
import { fullPassConnection } from './full-pass-table'
import { spfFailureConnection } from './spf-failure-table'

export const detailTablesType = new GraphQLObjectType({
  name: 'DetailTables',
  description:
    'Object that contains the various senders and details for each category.',
  fields: () => ({
    dkimFailure: {
      description: 'List of senders that are failing DKIM checks.',
      args: connectionArgs,
      type: dkimFailureConnection.connectionType,
      resolve: ({ dkimFailure }) => dkimFailure,
    },
    dmarcFailure: {
      description: 'List of senders that are failing DMARC checks.',
      args: connectionArgs,
      type: dmarcFailureConnection.connectionType,
      resolve: ({ dmarcFailure }) => dmarcFailure,
    },
    fullPass: {
      description: 'List of senders that are passing all checks.',
      args: connectionArgs,
      type: fullPassConnection.connectionType,
      resolve: ({ fullPass }) => fullPass,
    },
    spfFailure: {
      description: 'List of senders that are failing SPF checks.',
      args: connectionArgs,
      type: spfFailureConnection.connectionType,
      resolve: ({ spfFailure }) => spfFailure,
    },
  }),
})
