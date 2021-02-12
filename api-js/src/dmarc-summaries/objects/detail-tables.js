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
      resolve: async (
        { _id },
        args,
        { loaders: { dkimFailureLoaderConnectionsBySumId } },
      ) => {
        const dkimFailures = await dkimFailureLoaderConnectionsBySumId({
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
        { loaders: { dmarcFailureLoaderConnectionsBySumId } },
      ) => {
        const dmarcFailures = await dmarcFailureLoaderConnectionsBySumId({
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
        { loaders: { fullPassLoaderConnectionsBySumId } },
      ) => {
        const fullPasses = await fullPassLoaderConnectionsBySumId({
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
        { loaders: { spfFailureLoaderConnectionsBySumId } },
      ) => {
        const spfFailures = await spfFailureLoaderConnectionsBySumId({
          summaryId: _id,
          ...args,
        })

        return spfFailures
      },
    },
  }),
})
