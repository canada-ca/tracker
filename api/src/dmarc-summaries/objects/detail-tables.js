import { GraphQLObjectType } from 'graphql'
import { connectionArgs } from 'graphql-relay'

import { dkimFailureConnection } from './dkim-failure-table-connection'
import { dmarcFailureConnection } from './dmarc-failure-table-connection'
import { fullPassConnection } from './full-pass-table-connection'
import { spfFailureConnection } from './spf-failure-table-connection'

export const detailTablesType = new GraphQLObjectType({
  name: 'DetailTables',
  description:
    'Object that contains the various senders and details for each category.',
  fields: () => ({
    dkimFailure: {
      description: 'List of senders that are failing DKIM checks.',
      args: connectionArgs,
      type: dkimFailureConnection.connectionType,
      resolve: async (
        { _id },
        args,
        { loaders: { loadDkimFailConnectionsBySumId } },
      ) => {
        const dkimFailures = await loadDkimFailConnectionsBySumId({
          summaryId: _id,
          ...args,
        })

        return dkimFailures
      },
    },
    dmarcFailure: {
      description: 'List of senders that are failing DMARC checks.',
      args: connectionArgs,
      type: dmarcFailureConnection.connectionType,
      resolve: async (
        { _id },
        args,
        { loaders: { loadDmarcFailConnectionsBySumId } },
      ) => {
        const dmarcFailures = await loadDmarcFailConnectionsBySumId({
          summaryId: _id,
          ...args,
        })

        return dmarcFailures
      },
    },
    fullPass: {
      description: 'List of senders that are passing all checks.',
      args: connectionArgs,
      type: fullPassConnection.connectionType,
      resolve: async (
        { _id },
        args,
        { loaders: { loadFullPassConnectionsBySumId } },
      ) => {
        const fullPasses = await loadFullPassConnectionsBySumId({
          summaryId: _id,
          ...args,
        })

        return fullPasses
      },
    },
    spfFailure: {
      description: 'List of senders that are failing SPF checks.',
      args: connectionArgs,
      type: spfFailureConnection.connectionType,
      resolve: async (
        { _id },
        args,
        { loaders: { loadSpfFailureConnectionsBySumId } },
      ) => {
        const spfFailures = await loadSpfFailureConnectionsBySumId({
          summaryId: _id,
          ...args,
        })

        return spfFailures
      },
    },
  }),
})
