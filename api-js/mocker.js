import { makeExecutableSchema } from '@graphql-tools/schema'
import { addMocksToSchema } from '@graphql-tools/mock'
import { createQuerySchema } from './src/query'
import { createMutationSchema } from './src/mutation'
import { GraphQLSchema, printSchema } from 'graphql'
const { ApolloServer } = require('apollo-server')


const createSchema = () =>
  new GraphQLSchema({
    query: createQuerySchema(),
    mutation: createMutationSchema(),
  })

// Fill this in with the schema string
const schemaString = printSchema(createSchema())

// Make a GraphQL schema with no resolvers
const schema = makeExecutableSchema({ typeDefs: schemaString })

// Create a new schema with mocks
const schemaWithMocks = addMocksToSchema({ schema })

const server = new ApolloServer({
  schema: schemaWithMocks,
})

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`)
})


