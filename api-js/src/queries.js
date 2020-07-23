const {} = require('graphql')
const { nodeField } = require('')

const query = new GraphQLObjectType({
  name: 'Query',
  fields: () => ({
    node: nodeField,
  }),
})
