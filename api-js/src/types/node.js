const { nodeDefinitions } = require('graphql-relay')

const registeredTypes = {}

const { nodeField, nodeInterface } = nodeDefinitions((object) => {
  return registeredTypes[object.constructor.name] || null
})

module.exports = {
  nodeField,
  nodeInterface,
}
