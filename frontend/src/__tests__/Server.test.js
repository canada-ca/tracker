import request from 'supertest'
import { Server } from '../Server'

describe('Server', () => {
  it('does not include express headers', async () => {
    const server = new Server()
    const { headers } = await request(server).get('/')
    expect(headers).not.toHaveProperty('x-powered-by')
  })

  describe('GET', () => {
    describe('/alive', () => {
      it('confirms the server is running', async () => {
        const server = new Server()
        const response = await request(server).get('/alive')

        expect(response.status).toEqual(200)
        expect(response.body).toEqual({ status: 'ok' })
      })
    })

    describe('/ready', () => {
      it('confirms the server is ready', async () => {
        const server = new Server()
        const response = await request(server).get('/ready')

        expect(response.status).toEqual(200)
        expect(response.body).toEqual({ status: 'ready' })
      })
    })
  })
})
