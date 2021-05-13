import { makeExecutableSchema } from '@graphql-tools/schema'
import { addMocksToSchema } from '@graphql-tools/mock'
import { getTypeNames } from './faked_schema'
import { ApolloServer } from 'apollo-server'
import faker from 'faker'
import { connectionFromArray } from 'graphql-relay/lib/connection/arrayconnection'
import { getStringOfDomains } from './helpers/getStringOfDomains'
import { getDmarcTableResults } from './helpers/getDmarcTableResults'
import { getDkimSelectors } from './helpers/getDkimSelectors'

const schemaString = getTypeNames()

const schema = makeExecutableSchema({ typeDefs: schemaString })

// Add custom mocks here to override or customize default mocks, useful for forcing environments
// e.g. SignInUnion: () => ({ __typename: 'AuthResult' })  for correct password and no 2FA
const mockOverrides = {
  PersonalUser: () => {
    const affiliationCount = faker.datatype.number({ min: 0, max: 200 })

    return {
      displayName: faker.name.findName(),
      affiliations: {
        edges: [...new Array(affiliationCount)],
        totalCount: affiliationCount,
      },
      preferredLang: 'ENGLISH',
    }
  },
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
  Date: () => {
    // gives date in format "2020-12-31 15:30:20.262Z"
    return new Date(faker.date.between('2019-01-01', '2022-01-01'))
      .toISOString()
      .replace('T', ' ')
  },
  DkimFailureTable: () => {
    const dkimDomains = getStringOfDomains(0, 2)
    const dkimResults = getDmarcTableResults()
    const dkimSelectors = getDkimSelectors()
    const dnsHost = faker.internet.domainName()
    const envelopeFrom = faker.internet.domainName()
    const guidance = 'guidance' + faker.datatype.number({ min: 0, max: 8 })
    const headerFrom = faker.internet.domainName()
    const sourceIpAddress = faker.internet.ip()
    const totalMessages = faker.datatype.number({ min: 1, max: 10000 })

    return {
      dkimDomains,
      dkimResults,
      dkimSelectors,
      dnsHost,
      envelopeFrom,
      guidance,
      headerFrom,
      sourceIpAddress,
      totalMessages,
    }
  },
  DkimFailureTableConnection: () => {
    const numberOfEdges = 50

    return {
      edges: [...new Array(numberOfEdges)],
      totalCount: numberOfEdges,
    }
  },
  DmarcFailureTable: () => {
    const dkimDomains = getStringOfDomains(0, 2)
    const dkimSelectors = getDkimSelectors()
    const disposition =
      faker.datatype.number({ min: 0, max: 1 }) === 0 ? 'none' : 'quarantine'
    const dnsHost = faker.internet.domainName()
    const envelopeFrom = faker.internet.domainName()
    const headerFrom = faker.internet.domainName()
    const sourceIpAddress = faker.internet.ip()
    const spfDomains = getStringOfDomains(0, 2)
    const totalMessages = faker.datatype.number({ min: 1, max: 10000 })

    return {
      dkimDomains,
      dkimSelectors,
      disposition,
      dnsHost,
      envelopeFrom,
      headerFrom,
      sourceIpAddress,
      spfDomains,
      totalMessages,
    }
  },
  DmarcFailureTableConnection: () => {
    const numberOfEdges = 50

    return {
      edges: [...new Array(numberOfEdges)],
      totalCount: numberOfEdges,
    }
  },
  DmarcSummaryConnection: () => {
    const numberOfEdges = faker.datatype.number({ min: 0, max: 500 })
    return {
      edges: [...new Array(numberOfEdges)],
      totalCount: numberOfEdges,
    }
  },
  Domain: () => {
    // gives date in format "2020-12-31 15:30:20.262Z"
    const lastRan = new Date(faker.date.between('2019-01-01', '2022-01-01'))
      .toISOString()
      .replace('T', ' ')
    const curDate = new Date()

    // generate an object matching DmarcSummary
    const generateFakeSummary = (currentDate, month, year) => {
      const totalMessageCount = faker.datatype.number({ min: 0, max: 10000 })
      const fullPassCount = faker.datatype.number({
        min: 0,
        max: totalMessageCount,
      })
      const passSpfOnlyCount = faker.datatype.number({
        min: 0,
        max: fullPassCount,
      })
      const passDkimOnlyCount = faker.datatype.number({
        min: 0,
        max: passSpfOnlyCount,
      })
      const failCount = faker.datatype.number({
        min: 0,
        max: passDkimOnlyCount,
      })

      const fullPassPercent = fullPassCount / totalMessageCount
      const passSpfOnlyPercent = passSpfOnlyCount / totalMessageCount
      const passDkimOnlyPercent = passDkimOnlyCount / totalMessageCount
      const failPercent = failCount / totalMessageCount

      return {
        month:
          month ||
          currentDate
            .toLocaleString('default', { month: 'long' })
            .toUpperCase(),
        year: year || currentDate.getFullYear(),
        categoryTotals: {
          fullPass: fullPassCount,
          passSpfOnly: passSpfOnlyCount,
          passDkimOnly: passDkimOnlyCount,
          fail: failCount,
        },
        categoryPercentages: {
          fullPassPercentage: fullPassPercent,
          passSpfOnlyPercentage: passSpfOnlyPercent,
          passDkimOnlyPercentage: passDkimOnlyPercent,
          failPercentage: failPercent,
          totalMessages: totalMessageCount,
        },
      }
    }
    const yearlyDmarcSummaries = []
    // create list of summaries for the past 13 months
    for (let i = 13; i > 0; i--) {
      yearlyDmarcSummaries.push(generateFakeSummary(curDate))
      curDate.setMonth(curDate.getMonth() - 1)
    }

    return {
      lastRan,
      yearlyDmarcSummaries,
    }
  },
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
  FullPassTable: () => {
    const dkimDomains = getStringOfDomains(0, 2)
    const dkimSelectors = getDkimSelectors()
    const dnsHost = faker.internet.domainName()
    const envelopeFrom = faker.internet.domainName()
    const headerFrom = faker.internet.domainName()
    const sourceIpAddress = faker.internet.ip()
    const spfDomains = getStringOfDomains(0, 2)
    const totalMessages = faker.datatype.number({ min: 1, max: 10000 })

    return {
      dkimDomains,
      dkimSelectors,
      dnsHost,
      envelopeFrom,
      headerFrom,
      sourceIpAddress,
      spfDomains,
      totalMessages,
    }
  },
  FullPassTableConnection: () => {
    const numberOfEdges = 50

    return {
      edges: [...new Array(numberOfEdges)],
      totalCount: numberOfEdges,
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
  SpfFailureTableConnection: () => {
    const numberOfEdges = 50

    return {
      edges: [...new Array(numberOfEdges)],
      totalCount: numberOfEdges,
    }
  },
  TFASignInResult: () => ({
    authenticateToken: faker.datatype.uuid(),
    sendMethod: faker.random.arrayElement(['email', 'phone']),
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
    DetailTables: {
      dkimFailure: (_, args, __, resolveInfo) => {
        return getConnectionObject(store, args, resolveInfo)
      },
      dmarcFailure: (_, args, __, resolveInfo) => {
        return getConnectionObject(store, args, resolveInfo)
      },
      fullPass: (_, args, __, resolveInfo) => {
        return getConnectionObject(store, args, resolveInfo)
      },
      spfFailure: (_, args, __, resolveInfo) => {
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
