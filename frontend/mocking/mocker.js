import { makeExecutableSchema } from '@graphql-tools/schema'
import { addMocksToSchema } from '@graphql-tools/mock'
import { getTypeNames } from './faked_schema'
import { ApolloServer } from 'apollo-server'
import { PubSub } from 'graphql-subscriptions'
import faker from 'faker'
import { connectionFromArray } from 'graphql-relay'
import { getStringOfDomains } from './helpers/getStringOfDomains'
import { getDmarcTableResults } from './helpers/getDmarcTableResults'
import { getDkimSelectors } from './helpers/getDkimSelectors'
import { getCanadianLocation } from './helpers/getCanadianLocation'
import jwt from 'jsonwebtoken'

const NEW_DKIM_DATA_STREAM = 'NEW_DKIM_DATA'
const NEW_DMARC_DATA_STREAM = 'NEW_DMARC_DATA'
const NEW_SPF_DATA_STREAM = 'NEW_SPF_DATA'
const NEW_HTTPS_DATA_STREAM = 'NEW_HTTPS_DATA'
const NEW_SSL_DATA_STREAM = 'NEW_SLL_DATA'
const REFRESH_TOKEN_EXPIRY_SECONDS = 60 * 5
const JWT_TOKEN_EXPIRY_SECONDS = 60 * 2

const parseCookies = (str) => {
  if (!str) return {}
  return str.split('; ').reduce((a, c) => {
    const [n, v] = c.split('=')
    return { ...a, [n]: decodeURIComponent(v) }
  }, {})
}

const tokenize = ({ expiresIn = '15m', parameters = {} }) =>
  jwt.sign(
    {
      parameters,
    },
    'secret',
    { expiresIn: expiresIn },
  )

const pubsub = new PubSub()

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
      emailValidated: true,
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
    authToken: tokenize({
      parameters: { userKey: faker.datatype.number({ min: 0, max: 100 }) },
    }),
  }),
  CategorizedSummary: () => {
    const domainCount = faker.datatype.number({ min: 4000, max: 10000 })
    const passCount = faker.datatype.number({ min: 0, max: domainCount })
    const failCount = domainCount - passCount
    const passPercentage = (passCount / domainCount) * 100
    const failPercentage = 100 - passPercentage

    return {
      total: domainCount,
      categories: [
        {
          name: 'pass',
          count: passCount,
          percentage: passPercentage,
        },
        {
          name: 'fail',
          count: failCount,
          percentage: failPercentage,
        },
      ],
    }
  },
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
  ConnectionInfo: () => {
    return {
      headers: {
        'Content-Length': '62',
        'Content-Type': 'text/html; charset=utf-8',
      },
    }
  },
  Date: () => {
    // gives date in format "2020-12-31 15:30:20.262Z"
    return new Date(faker.date.between('2019-01-01', '2022-01-01')).toISOString().replace('T', ' ')
  },
  DateTime: () => {
    // gives date in format "2020-12-31 15:30:20.262Z"
    return new Date(faker.date.between('2019-01-01', '2022-01-01')).toISOString()
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
    const disposition = faker.helpers.randomize(['none', 'quarantine'])
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
  DmarcSub: () => {
    return {
      dmarcPhase: faker.helpers.randomize(['maintain', 'deploy', 'not implemented']),
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
    const lastRan =
      Math.random() > 0.2
        ? new Date(faker.date.between('2019-01-01', '2022-01-01')).toISOString().replace('T', ' ')
        : null
    const curDate = new Date()
    const dmarcPhase = faker.random.arrayElement(['assess', 'deploy', 'enforce', 'maintain', 'not implemented'])

    // generate an object matching DmarcSummary
    const generateFakeSummary = (currentDate, month, year) => {
      const totalMessageCount = faker.datatype.number({ min: 0, max: 10000 })
      let maxNumber = totalMessageCount
      const fullPassCount = faker.datatype.number({
        min: 0,
        max: maxNumber,
      })
      maxNumber -= fullPassCount
      const passSpfOnlyCount = faker.datatype.number({
        min: 0,
        max: maxNumber,
      })
      maxNumber -= passSpfOnlyCount
      const passDkimOnlyCount = faker.datatype.number({
        min: 0,
        max: maxNumber,
      })
      const failCount = maxNumber - passDkimOnlyCount

      const fullPassPercent = Math.round((100 * fullPassCount) / totalMessageCount)
      const passSpfOnlyPercent = Math.round((100 * passSpfOnlyCount) / totalMessageCount)
      const passDkimOnlyPercent = Math.round((100 * passDkimOnlyCount) / totalMessageCount)
      const failPercent = Math.round((100 * failCount) / totalMessageCount)

      return {
        month: month || currentDate.toLocaleString('default', { month: 'long' }).toUpperCase(),
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
      dmarcPhase,
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
  GuidanceTag: () => {
    const tagId = 'tag' + faker.datatype.number({ min: 1, max: 14 })
    const tagName =
      'TAG-' + faker.helpers.randomize(['missing', 'downgraded', 'bad-chain', 'short-age', 'certificate-expired'])
    // const guidance = faker.lorem.sentence()
    const refLinks = [...new Array(1)]
    const refLinksTech = [...new Array(1)]

    return {
      // guidance,
      refLinks,
      refLinksTech,
      tagId,
      tagName,
    }
  },
  HTTPSConnection: () => {
    const numberOfEdges = 10

    return {
      edges: [...new Array(numberOfEdges)],
      totalCount: numberOfEdges,
    }
  },
  MyTrackerResult: () => {
    const domainCount = faker.datatype.number({ min: 0, max: 500 })
    const httpsPassCount = faker.datatype.number({ min: 0, max: domainCount })
    const httpsFailCount = domainCount - httpsPassCount
    const httpsPassPercentage = (httpsPassCount / domainCount) * 100
    const httpsFailPercentage = 100 - httpsPassPercentage
    const https = {
      total: domainCount,
      categories: [
        {
          name: 'pass',
          count: httpsPassCount,
          percentage: httpsPassPercentage,
        },
        {
          name: 'fail',
          count: httpsFailCount,
          percentage: httpsFailPercentage,
        },
      ],
    }

    const mailPassCount = faker.datatype.number({ min: 0, max: domainCount })
    const mailFailCount = domainCount - mailPassCount
    const mailPassPercentage = (mailPassCount / domainCount) * 100
    const mailFailPercentage = 100 - mailPassPercentage
    const dmarc = {
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

    const dmarcPhase = dmarcPhaseSummaryMock()
    return {
      domainCount,
      domains: {
        edges: [...new Array(domainCount)],
        totalCount: domainCount,
      },
      summaries: { https, dmarc, dmarcPhase },
    }
  },
  Organization: () => {
    const name = faker.company.companyName()
    const slug = faker.helpers.slugify(name)
    const domainCount = faker.datatype.number({ min: 0, max: 500 })
    const location = getCanadianLocation()
    const city = location.city
    const province = location.province

    const httpsPassCount = faker.datatype.number({ min: 0, max: domainCount })
    const httpsFailCount = domainCount - httpsPassCount
    const httpsPassPercentage = (httpsPassCount / domainCount) * 100
    const httpsFailPercentage = 100 - httpsPassPercentage
    const https = {
      total: domainCount,
      categories: [
        {
          name: 'pass',
          count: httpsPassCount,
          percentage: httpsPassPercentage,
        },
        {
          name: 'fail',
          count: httpsFailCount,
          percentage: httpsFailPercentage,
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

    const dmarcPhase = dmarcPhaseSummaryMock()

    const affiliationCount = faker.datatype.number({ min: 0, max: 200 })

    return {
      affiliations: {
        edges: [...new Array(affiliationCount)],
        totalCount: affiliationCount,
      },
      city,
      domainCount,
      domains: {
        edges: [...new Array(domainCount)],
        totalCount: domainCount,
      },
      name,
      province,
      slug,
      summaries: { https, mail, dmarcPhase },
    }
  },
  OrganizationConnection: () => {
    const numberOfEdges = faker.datatype.number({ min: 0, max: 500 })
    return {
      edges: [...new Array(numberOfEdges)],
      totalCount: numberOfEdges,
    }
  },
  OrganizationSummaryConnection: () => {
    const numberOfEdges = faker.datatype.number({ min: 30, max: 365 })
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
  RefLinks: () => {
    const description = faker.lorem.sentence()
    const refLink = faker.internet.url()

    return {
      description,
      refLink,
    }
  },
  Selector: () => 'selector' + faker.datatype.number({ min: 1, max: 9 }),
  SignInError: () => ({
    description: 'Mocked sign in error description',
  }),
  SharedUser: () => ({ displayName: faker.name.findName() }),
  SpfFailureTable: () => {
    const dnsHost = faker.internet.domainName()
    const envelopeFrom = faker.internet.domainName()
    const guidance = 'guidance' + faker.datatype.number({ min: 0, max: 8 })
    const headerFrom = faker.internet.domainName()
    const sourceIpAddress = faker.internet.ip()
    const spfDomains = getStringOfDomains(0, 2)
    const spfResults = getDmarcTableResults()
    const totalMessages = faker.datatype.number({ min: 1, max: 10000 })

    return {
      dnsHost,
      envelopeFrom,
      guidance,
      headerFrom,
      sourceIpAddress,
      spfDomains,
      spfResults,
      totalMessages,
    }
  },
  SpfFailureTableConnection: () => {
    const numberOfEdges = 50

    return {
      edges: [...new Array(numberOfEdges)],
      totalCount: numberOfEdges,
    }
  },
  SSLConnection: () => {
    const numberOfEdges = 10

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
  MXHost: () => ({
    addresses: [...new Array(faker.datatype.number({ min: 1, max: 2 }))].map(() => faker.internet.ip()),
    hostname: faker.internet.domainName(),
    preference: faker.datatype.number({ min: 1, max: 10 }),
  }),
  ...mockOverrides,
}

const edgesToConnection = (store, edges, args) => {
  // we only need the nodes since connectionFromArray will generate the proper cursors
  // extract all nodes and place into new array
  const allNodes = edges.map((edge) => {
    return store.get(edge.$ref.typeName, edge.$ref.key, 'node')
  })

  const requestedConnection = connectionFromArray(allNodes, args)

  return {
    totalCount: allNodes.length,
    ...requestedConnection,
  }
}

const getConnectionObject = (store, args, resolveInfo) => {
  // use key of calling object to ensure consistency
  const allEdges = store.get(resolveInfo.returnType.toString(), resolveInfo.path.key, 'edges')

  return edgesToConnection(store, allEdges, args)
}

const dmarcPhaseSummaryMock = () => {
  // DMARC phases:
  // NA. Not Implemented
  //  1. Assess
  //  2. Deploy
  //  3. Enforce
  //  4. Maintain

  const notImplementedTotal = faker.datatype.number({ min: 1, max: 2000 })
  const assessTotal = faker.datatype.number({ min: 1, max: 2000 })
  const deployTotal = faker.datatype.number({ min: 1, max: 2000 })
  const enforceTotal = faker.datatype.number({ min: 1, max: 2000 })
  const maintainTotal = faker.datatype.number({ min: 1, max: 2000 })

  const totalDomains = notImplementedTotal + assessTotal + deployTotal + enforceTotal + maintainTotal

  const notImplementedCategory = {
    name: 'not implemented',
    count: notImplementedTotal,
    percentage: (notImplementedTotal / totalDomains) * 100,
  }
  const assessCategory = {
    name: 'assess',
    count: assessTotal,
    percentage: (assessTotal / totalDomains) * 100,
  }
  const deployCategory = {
    name: 'deploy',
    count: deployTotal,
    percentage: (deployTotal / totalDomains) * 100,
  }
  const enforceCategory = {
    name: 'enforce',
    count: enforceTotal,
    percentage: (enforceTotal / totalDomains) * 100,
  }
  const maintainCategory = {
    name: 'maintain',
    count: maintainTotal,
    percentage: (maintainTotal / totalDomains) * 100,
  }

  const categories = [notImplementedCategory, assessCategory, deployCategory, enforceCategory, maintainCategory]

  return {
    total: totalDomains,
    categories,
  }
}

// Create a new schema with mocks and resolvers
const schemaWithMocks = addMocksToSchema({
  schema,
  mocks,
  resolvers: (store) => ({
    Query: {
      findMe: (_, _args, context, _resolveInfo, ___) => {
        return store.get('PersonalUser', jwt.decode(context.token, 'secret').parameters.userKey)
      },
      findMyDmarcSummaries: (_, args, _context, resolveInfo, ___) => {
        return getConnectionObject(store, args, resolveInfo)
      },
      findMyDomains: (_, args, _context, resolveInfo) => {
        return getConnectionObject(store, args, resolveInfo)
      },
      findOrganizationBySlug: (_, args, _context, _resolveInfo) => {
        return store.get('Organization', args.orgSlug)
      },
      findMyOrganizations: (_, args, _context, resolveInfo) => {
        return getConnectionObject(store, args, resolveInfo)
      },
      findMyTracker: (_, _args, _context, _resolveInfo) => {
        return store.get('MyTrackerResult')
      },
      dmarcPhaseSummary: (_, _args, _context, _resolveInfo) => {
        return dmarcPhaseSummaryMock()
      },
    },
    DetailTables: {
      dkimFailure: (_, args, _context, resolveInfo) => {
        return getConnectionObject(store, args, resolveInfo)
      },
      dmarcFailure: (_, args, _context, resolveInfo) => {
        return getConnectionObject(store, args, resolveInfo)
      },
      fullPass: (_, args, _context, resolveInfo) => {
        return getConnectionObject(store, args, resolveInfo)
      },
      spfFailure: (_, args, _context, resolveInfo) => {
        return getConnectionObject(store, args, resolveInfo)
      },
    },
    Organization: {
      affiliations: (parent, args, _context, _resolveInfo) => {
        const organizationAffiliationEdges = store.get(parent, ['affiliations', 'edges'])
        return edgesToConnection(store, organizationAffiliationEdges, args)
      },
      domains: (parent, args, _context, _resolveInfo) => {
        const organizationDomainEdges = store.get(parent, ['domains', 'edges'])
        return edgesToConnection(store, organizationDomainEdges, args)
      },
    },
    Mutation: {
      refreshTokens: (_, _args, context, _resolveInfo) => {
        if (!context.cookies.refresh_token) {
          return {
            result: {
              code: 401,
              description: 'Failed to refresh tokens. Please log in.',
              type: 'AuthenticateError',
            },
          }
        }

        const cookieData = {
          maxAge: 1000 * REFRESH_TOKEN_EXPIRY_SECONDS,
          httpOnly: true,
          secure: true,
          sameSite: true,
        }

        const refreshToken = tokenize({
          parameters: {
            userKey: jwt.decode(context.cookies.refresh_token, 'secret').parameters.userKey,
          },
          expiresIn: '15m',
        })

        context.res.cookie('refresh_token', refreshToken, cookieData)
        return {
          result: {
            authToken: tokenize({
              parameters: {
                userKey: jwt.decode(context.cookies.refresh_token, 'secret').parameters.userKey,
              },
            }),
            user: store.get('PersonalUser', jwt.decode(context.cookies.refresh_token, 'secret').parameters.userKey),
            type: 'AuthResult',
          },
        }
      },
      requestScan: async (_, _args, context, _resolveInfo) => {
        const scanUuid = faker.datatype.uuid()

        store.set('DkimSub', scanUuid, 'sharedId', scanUuid)
        const dkimScanData = store.get('DkimSub', scanUuid)
        setTimeout(() => {
          pubsub.publish(`${NEW_DKIM_DATA_STREAM}/${jwt.decode(context.token, 'secret').parameters.userKey}`, {
            dkimScanData: dkimScanData,
          })
        }, Math.random() * 10000)

        store.set('DmarcSub', scanUuid, 'sharedId', scanUuid)
        const dmarcScanData = store.get('DmarcSub', scanUuid)
        setTimeout(() => {
          pubsub.publish(`${NEW_DMARC_DATA_STREAM}/${jwt.decode(context.token, 'secret').parameters.userKey}`, {
            dmarcScanData: dmarcScanData,
          })
        }, Math.random() * 10000)

        store.set('SpfSub', scanUuid, 'sharedId', scanUuid)
        const spfScanData = store.get('SpfSub', scanUuid)
        setTimeout(() => {
          pubsub.publish(`${NEW_SPF_DATA_STREAM}/${jwt.decode(context.token, 'secret').parameters.userKey}`, {
            spfScanData: spfScanData,
          })
        }, Math.random() * 10000)

        store.set('HttpsSub', scanUuid, 'sharedId', scanUuid)
        const httpsScanData = store.get('HttpsSub', scanUuid)
        setTimeout(() => {
          pubsub.publish(`${NEW_HTTPS_DATA_STREAM}/${jwt.decode(context.token, 'secret').parameters.userKey}`, {
            httpsScanData: httpsScanData,
          })
        }, Math.random() * 10000)

        store.set('SslSub', scanUuid, 'sharedId', scanUuid)
        const sslScanData = store.get('SslSub', scanUuid)
        setTimeout(() => {
          pubsub.publish(`${NEW_SSL_DATA_STREAM}/${jwt.decode(context.token, 'secret').parameters.userKey}`, {
            sslScanData: sslScanData,
          })
        }, Math.random() * 10000)

        return {
          status: 'Scan requested.',
        }
      },
      signOut: (_, _args, context, _resolveInfo) => {
        context.res.cookie('refresh_token', '', {
          httpOnly: true,
          secure: true,
          sameSite: true,
        })
        return { status: 'Successfully signed out.' }
      },
      updateOrganization: (_, args, _context, _resolveInfo) => {
        Object.entries(args.input).forEach((entry) => {
          const [key, value] = entry
          if (key === 'id') return

          // Current mock implementation does not support multi-lang, remove language from keys
          store.set('Organization', args.input.id, key.substring(0, key.length - 2), value)
        })

        return {
          result: store.get('Organization', args.input.id),
        }
      },
      setPhoneNumber: (_, args, context, _resolveInfo) => {
        store.set(
          'PersonalUser',
          jwt.decode(context.token, 'secret').parameters.userKey,
          'phoneNumber',
          args.input.phoneNumber,
        )
        return {
          result: {
            status: 'Phone number has been successfully set, you will receive a verification text message shortly.',
            user: store.get('PersonalUser', jwt.decode(context.token, 'secret').parameters.userKey),
            type: 'SetPhoneNumberResult',
          },
        }
      },
      signIn: (_, _args, context, _resolveInfo) => {
        const userId = faker.datatype.number({ min: 0, max: 100 })
        const user = store.get('PersonalUser', userId)

        const cookieData = {
          maxAge: 1000 * 60 * 5,
          httpOnly: true,
          secure: true,
          sameSite: true,
        }

        const refreshToken = tokenize({
          parameters: {
            userKey: userId,
          },
        })

        context.res.cookie('refresh_token', refreshToken, cookieData)

        return {
          result: {
            authToken: tokenize({
              parameters: {
                userKey: userId,
              },
            }),
            user,
          },
        }
      },
    },
    RefreshTokensUnion: {
      __resolveType: ({ type }) => {
        return type
      },
    },
    SetPhoneNumberUnion: {
      __resolveType: ({ type }) => {
        return type
      },
    },
    SignInUnion: {
      __resolveType: (obj, _context, _resolveInfo) => {
        if (obj.authToken) return 'AuthResult'
      },
    },
  }),
})

const server = new ApolloServer({
  schema: schemaWithMocks,
  context: async ({ req, res, connection }) => {
    if (connection) {
      // Operation is a Subscription
      const token = connection.context.authorization

      return { token }
    }

    const token = req.headers.authorization

    const cookies = req.headers.cookie ? parseCookies(req.headers.cookie) : {}

    return { token, res, cookies }
  },
  subscriptions: {
    onConnect: (connectionParams, _websocket) => {
      if (connectionParams.authorization) {
        return connectionParams
      }

      throw new Error(`Authentication error. Please sign in.`)
    },
  },
})

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`)
})
