import request from 'supertest'
import { Server } from '../Server'

describe('Server', () => {
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
