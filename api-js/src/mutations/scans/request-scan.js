const { GraphQLString } = require('graphql')
const { mutationWithClientMutationId } = require('graphql-relay')
const { ScanTypeEnums } = require('../../enums')
const { Slug } = require('../../scalars')

const requestScan = new mutationWithClientMutationId({
  name: 'RequestScan',
  description:
    'This mutation is used to run a manual scan on a requested domain.',
  inputFields: () => ({
    urlSlug: {
      type: Slug,
      description: 'The domain that the scan will be ran on.',
    },
    scanType: {
      type: ScanTypeEnums,
      description:
        "Type of scan to preform on the requested domain ('WEB' or 'MAIL').",
    },
  }),
  outputFields: () => ({
    status: {
      type: GraphQLString,
      description: 'Informs the user if the scan was dispatched successfully.',
      resolve: async () => {},
    },
  }),
  mutateAndGetPayload: async () => {},
})

module.exports = {
  requestScan,
}
