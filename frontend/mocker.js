import { makeExecutableSchema } from '@graphql-tools/schema'
import { addMocksToSchema } from '@graphql-tools/mock'
import { getTypeNames } from './faked_schema'
import { ApolloServer } from 'apollo-server'
import faker from 'faker'
import { connectionFromArray } from 'graphql-relay/lib/connection/arrayconnection'

const schemaString = getTypeNames()

const schema = makeExecutableSchema({ typeDefs: schemaString })

// Add custom mocks here to override default mocks
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
  DmarcSummaryConnection: () => {
    const numberOfEdges = faker.datatype.number({ min: 0, max: 500 })
    return {
      edges: [...new Array(numberOfEdges)],
      totalCount: numberOfEdges,
    }
  },
  Domain: () => ({
    lastRan: () => {
      // generate fake date in ISO format, replace unwanted 'T'
      return new Date(faker.date.between('2019-01-01', '2022-01-01'))
        .toISOString()
        .replace('T', ' ')
    },
  }),
  DomainConnection: () => {
    const numberOfEdges = faker.datatype.number({ min: 0, max: 500 })
    return {
      edges: [...new Array(numberOfEdges)],
      totalCount: numberOfEdges,
    }
  },
  DomainScalar: () => faker.internet.domainName(),
  EmailAddress: () => faker.internet.email(),
  Organization: () => {
    const name = faker.company.companyName()
    const slug = faker.helpers.slugify(name)
    const domainCount = faker.datatype.number({ min: 0, max: 500 })

    const webPassCount = faker.datatype.number({ min: 0, max: domainCount })
    const webFailCount = domainCount - webPassCount
    const webPassPercentage = (webPassCount / domainCount) * 100
    const webFailPercentage = 100 - webPassPercentage
    const web = {
      total: domainCount,
      categories: [
        {
          name: 'pass',
          count: webPassCount,
          percentage: webPassPercentage,
        },
        {
          name: 'fail',
          count: webFailCount,
          percentage: webFailPercentage,
        },
      ],
    }

    const mailPassCount = faker.datatype.number({ min: 0, max: domainCount })
    const mailFailCount = domainCount - mailPassCount
    const mailPassPercentage = (mailPassCount / domainCount) * 100
    const mailFailPercentage = 100 - mailPassPercentage
    const mail = {
      total: domainCount,
      categories: [
        {
          name: 'pass',
          count: mailPassCount,
          percentage: mailPassPercentage,
        },
        {
          name: 'fail',
          count: mailFailCount,
          percentage: mailFailPercentage,
        },
      ],
    }

    const affiliationCount = faker.datatype.number({ min: 0, max: 200 })

    return {
      affiliations: {
        edges: [...new Array(affiliationCount)],
        totalCount: affiliationCount,
      },
      domainCount,
      domains: {
        edges: [...new Array(domainCount)],
        totalCount: domainCount,
      },
      name,
      slug,
      summaries: { web, mail },
    }
  },
  OrganizationConnection: () => {
    const numberOfEdges = faker.datatype.number({ min: 0, max: 500 })
    return {
      edges: [...new Array(numberOfEdges)],
      totalCount: numberOfEdges,
    }
  },
  PersonalUser: () => {
    const affiliationCount = faker.datatype.number({ min: 0, max: 200 })

    return {
      displayName: faker.name.findName(),
      affiliations: {
        edges: [...new Array(affiliationCount)],
        totalCount: affiliationCount,
      },
    }
  },
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

const getConnectionObject = (store, args, resolveInfo) => {
  // use key of calling object to ensure consistency
  const allEdges = store.get(
    resolveInfo.returnType.toString(),
    resolveInfo.path.key,
    'edges',
  )

  // we only need the nodes since connectionFromArray will generate the proper cursors
  // extract all nodes and place into new array
  const allNodes = allEdges.map((edge) => {
    return store.get(edge.$ref.typeName, edge.$ref.key, 'node')
  })

  const requestedConnection = connectionFromArray(allNodes, args)

  return {
    totalCount: allNodes.length,
    ...requestedConnection,
  }
}

// Create a new schema with mocks and resolvers
const schemaWithMocks = addMocksToSchema({
  schema,
  mocks,
  resolvers: (store) => ({
    Query: {
      findMyDmarcSummaries: (_, args, __, resolveInfo) => {
        return getConnectionObject(store, args, resolveInfo)
      },
      findMyDomains: (_, args, __, resolveInfo) => {
        return getConnectionObject(store, args, resolveInfo)
      },
      findMyOrganizations: (_, args, __, resolveInfo) => {
        return getConnectionObject(store, args, resolveInfo)
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
