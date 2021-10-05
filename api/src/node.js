import { nodeDefinitions } from 'graphql-relay'

export const { nodeField, nodesField, nodeInterface } = nodeDefinitions(
  (_globalId) => {},
  (object) => {
    switch (object) {
      default:
        return null
    }
  },
)
