const request = require('supertest')
const { Server } = require('../server')

describe('parse server', () => {
  describe('/alive', () => {
    it('returns 200', async () => {
      const response = await request(Server({ query: jest.fn() })).get('/alive')
      expect(response.status).toEqual(200)
    })
  })

  describe('/ready', () => {
    it('returns 200', async () => {
      const response = await request(Server({ query: jest.fn() })).get('/ready')
      expect(response.status).toEqual(200)
    })
  })

  describe('/graphql', () => {
    describe('endpoint is alive', () => {
      it('returns 200', async () => {
        const response = await request(Server({ query: jest.fn() })).get(
          '/graphql',
        )
        expect(response.status).toEqual(200)
      })
    })
  })
})