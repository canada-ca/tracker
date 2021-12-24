import { dispatch } from '../dispatch.js'
// https://github.com/facebook/jest/issues/9430#issuecomment-616232029
import { jest } from '@jest/globals' // support for ESM modules

describe('domain-dispatcher', () => {
  describe('dispatch', () => {
    describe('given an asyncIterator', () => {
      it('dispatches domains to each endpoint', async () => {
        const publish = jest.fn()
        const logger = {
          info: jest.fn(),
          error: jest.fn(),
        }

        const asyncIterable = {
          batches: {
            async *[Symbol.asyncIterator]() {
              yield [
                {
                  user_key: 1,
                  domain: 'tbs-sct.gc.ca',
                  domain_key: 'domains/1',
                  hash: '8a237c3e4033c5f9ec06f28edddbccd6',
                  shared_id: 1234,
                },
                {
                  user_key: 1,
                  domain: 'cyber.gc.ca',
                  domain_key: 'domains/2',
                  hash: '56f36ef5e84af6eef45299d58890bfe5',
                  shared_id: 1235,
                },
              ]
            },
          },
        }

        await dispatch({
          cursor: asyncIterable,
          endpoints: [
            'http://dns-scanner.scanners.svc.cluster.local',
            'http://https-scanner.scanners.svc.cluster.local',
          ],
          publish,
          logger,
        })
        // 1 batch of 2 domains = 2 dispatches
        expect(publish).toHaveBeenCalledTimes(2)
      })

      it('includes the domain hash when publishing', async () => {
        const publish = jest.fn()
        const logger = {
          info: jest.fn(),
          error: jest.fn(),
        }

        const asyncIterable = {
          batches: {
            async *[Symbol.asyncIterator]() {
              yield [
                {
                  user_key: 1,
                  domain: 'tbs-sct.gc.ca',
                  _key: '1',
                  hash: '8a237c3e4033c5f9ec06f28edddbccd6',
                  shared_id: 1234,
                },
              ]
            },
          },
        }

        await dispatch({
          cursor: asyncIterable,
          endpoints: [
            'http://dns-scanner.scanners.svc.cluster.local',
            'http://https-scanner.scanners.svc.cluster.local',
          ],
          publish,
          logger,
        })
        // 1 batch of 2 domains = 2 dispatches
        expect(publish).toHaveBeenCalledWith({
          channel: 'domains.1',
          msg: {
            domain: 'tbs-sct.gc.ca',
            domain_key: '1',
            hash: '8a237c3e4033c5f9ec06f28edddbccd6',
            selectors: [],
            shared_id: null,
            user_key: null,
          },
        })
      })

      it('handles errors', async () => {
        const logger = {
          info: jest.fn(),
          error: jest.fn(),
        }

        const asyncIterable = {
          batches: {
            async *[Symbol.asyncIterator]() {
              yield [
                {
                  user_key: 1,
                  domain: 'tbs-sct.gc.ca',
                  domain_key: 'domains/1',
                  hash: '8a237c3e4033c5f9ec06f28edddbccd6',
                  shared_id: 1234,
                },
                {
                  user_key: 1,
                  domain: 'cyber.gc.ca',
                  domain_key: 'domains/2',
                  hash: '56f36ef5e84af6eef45299d58890bfe5',
                  shared_id: 1235,
                },
              ]
            },
          },
        }

        await dispatch({
          cursor: asyncIterable,
          endpoints: [
            'http://dns-scanner.scanners.svc.cluster.local',
            'http://https-scanner.scanners.svc.cluster.local',
          ],
          publish: async () => {
            throw new Error('so bad!')
          },
          info: jest.fn(),
          logger,
        })

        expect(logger.error).toHaveBeenCalledTimes(2)
      })
    })
  })
})
