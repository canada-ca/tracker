import request from 'supertest'
import { Server } from '../server'

const {
  DEPTH_LIMIT: maxDepth,
  COST_LIMIT: complexityCost,
  SCALAR_COST: scalarCost,
  OBJECT_COST: objectCost,
  LIST_FACTOR: listFactor,
} = process.env

describe('parse server', () => {
  const consoleOutput = []
  const mockedLog = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  beforeAll(async () => {
    console.log = mockedLog
    console.warn = mockedWarn
  })

  afterEach(() => {
    consoleOutput.length = 0
  })

  describe('/alive', () => {
    it('returns 200', async () => {
      const response = await request(await Server({ query: jest.fn() })).get('/alive')
      expect(response.status).toEqual(200)
    })
  })

  describe('/ready', () => {
    it('returns 200', async () => {
      const response = await request(await Server({ query: jest.fn() })).get('/ready')
      expect(response.status).toEqual(200)
    })
  })

  describe('/graphql', () => {
    describe('endpoint is alive', () => {
      it('returns 200', async () => {
        const response = await request(
          await Server({
            maxDepth,
            complexityCost,
            scalarCost,
            objectCost,
            listFactor,
            tracing: false,
            context: {
              query: jest.fn(),
              collections: jest.fn(),
              transaction: jest.fn(),
            },
          }),
        )
          .post('/graphql')
          .set('Accept', 'application/json')
          .send({ query: '{__schema {types {kind}}}' })

        expect(response.status).toEqual(200)
      })
    })
    describe('validation rule is broken', () => {
      describe('query cost is too high', () => {
        it('returns an error message', async () => {
          const response = await request(
            await Server({
              maxDepth,
              complexityCost: 1,
              scalarCost: 100,
              objectCost: 100,
              listFactor: 100,
              context: {
                query: jest.fn(),
                collections: jest.fn(),
                transaction: jest.fn(),
              },
            }),
          )
            .post('/graphql')
            .set('Accept', 'application/json')
            .send({ query: '{__schema {types {kind}}}' })

          expect(response.status).toEqual(400)
          expect(response.text).toEqual(
            expect.stringContaining('Query error, query is too complex.'),
          )
        })
      })
      describe('query depth is too high', () => {
        it('returns an error message', async () => {
          const response = await request(
            await Server({
              maxDepth: 1,
              complexityCost: 1000,
              scalarCost: 1,
              objectCost: 1,
              listFactor: 1,
              context: {
                query: jest.fn(),
                collections: jest.fn(),
                transaction: jest.fn(),
              },
            }),
          )
            .post('/graphql')
            .set('Accept', 'application/json')
            .send({
              query: '{findVerifiedDomains (first: 5) { edges { node { id }}}}',
            })

          expect(response.status).toEqual(400)
          expect(response.text).toEqual(
            expect.stringContaining('exceeds maximum operation depth'),
          )
        })
      })
    })
  })
})
