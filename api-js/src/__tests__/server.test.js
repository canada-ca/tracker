const request = require('supertest')
const { Server } = require('../server')

describe('parse server', () => {
    describe('/alive', () => {
        it('responds with a 200', async () => {
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
})