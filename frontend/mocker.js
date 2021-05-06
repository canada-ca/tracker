import { makeExecutableSchema } from '@graphql-tools/schema'
import { addMocksToSchema } from '@graphql-tools/mock'
import { getTypeNames } from './faked_schema'
import { ApolloServer } from 'apollo-server'
import faker from 'faker'
import { connectionFromArray } from 'graphql-relay/lib/connection/arrayconnection'

const schemaString = getTypeNames()

const schema = makeExecutableSchema({ typeDefs: schemaString })

const mockOverrides = {
  SignInUnion: () => ({ __typename: 'AuthResult' }),
}

const mocks = {
  Acronym: () =>
    faker.random.arrayElement([
      'AAFC',
      'CICS',
      'CRA',
      'CSE',
      'CSIS',
      'DFO',
      'DND',
      'FCAC',
      'FINTRAC',
      'GAC',
      'HC',
      'INFC',
      'OIC',
      'PC',
      'RCMP',
      'TBS',
    ]),
  AuthResult: () => ({
    authToken: faker.datatype.uuid(),
  }),
  CategoryPercentages: () => {
    let maxNumber = 100
    const fullPassPercentage = faker.datatype.number({ min: 0, max: maxNumber })
    maxNumber = maxNumber - fullPassPercentage
    const passDkimOnlyPercentage = faker.datatype.number({
      min: 0,
      max: maxNumber,
    })
    maxNumber = maxNumber - passDkimOnlyPercentage
    const passSpfOnlyPercentage = faker.datatype.number({
      min: 0,
      max: maxNumber,
    })
    maxNumber = maxNumber - passSpfOnlyPercentage
    const failPercentage = maxNumber

    return {
      fullPassPercentage,
      passDkimOnlyPercentage,
      passSpfOnlyPercentage,
      failPercentage,
      totalMessages: faker.datatype.number({ min: 0, max: 15000 }),
    }
  },
  DomainConnection: () => {
    const numberOfEdges = faker.datatype.number({ min: 0, max: 500 })
    return {
      edges: [...new Array(numberOfEdges)],
      totalCount: numberOfEdges,
    }
  },
  EmailAddress: () => faker.internet.email(),
  DomainScalar: () => faker.internet.domainName(),
  PersonalUser: () => ({ displayName: faker.name.findName() }),
  PhoneNumber: () => faker.phone.phoneNumber('+1##########'),
  SignInError: () => ({
    description: 'Mocked sign in error description',
  }),
  TFASignInResult: () => ({
    authenticateToken: () => faker.datatype.uuid(),
    sendMethod: () => faker.random.arrayElement(['email', 'phone']),
  }),
  Year: () =>
    faker.datatype.number({
      min: 2019,
      max: 2021,
    }),
  ...mockOverrides,
}

// Create a new schema with mocks and resolvers
const schemaWithMocks = addMocksToSchema({
  schema,
  mocks,
  resolvers: (store) => ({
    Query: {
      findMyDomains: (_, args) => {
        // give key to always get the same connection object
        const allDomainEdges = store.get(
          'DomainConnection',
          'domainRefKey',
          'edges',
        )

        // We only need the nodes as connectionFromArray will generate proper cursors
        // extract all nodes and place into new array
        const allDomainNodes = []
        allDomainEdges.forEach((edge) => {
          const node = store.get('DomainEdge', edge.$ref.key, 'node')
          if (node) {
            allDomainNodes.push(node)
          }
        })

        const requestedDomains = connectionFromArray(allDomainNodes, args)

        return {
          totalCount: allDomainNodes.length,
          ...requestedDomains,
        }
      },
    },
    Mutation: {},
  }),
})

const server = new ApolloServer({
  schema: schemaWithMocks,
})

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`)
})
