import { stringify } from 'jest-matcher-utils'
import { ensure, dbNameFromFile } from 'arango-tools'
import { toGlobalId } from 'graphql-relay'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { databaseOptions } from '../../../../database-options'
import { cleanseInput } from '../../../validators'
import {
  loadAggregateGuidanceTagById,
  loadAggregateGuidanceTagConnectionsByTagId,
} from '../index'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the loadAggregateGuidanceTagConnectionsByTagId loader', () => {
  let query, drop, truncate, collections, user, i18n

  const consoleOutput = []
  const mockedConsole = (output) => consoleOutput.push(output)

  beforeAll(async () => {
    console.error = mockedConsole
    console.warn = mockedConsole
    ;({ query, drop, truncate, collections } = await ensure({
      type: 'database',
      name: dbNameFromFile(__filename),
      url,
      rootPassword: rootPass,
      options: databaseOptions({ rootPass }),
    }))
    i18n = setupI18n({
      locale: 'en',
      localeData: {
        en: { plurals: {} },
        fr: { plurals: {} },
      },
      locales: ['en', 'fr'],
      messages: {
        en: englishMessages.messages,
        fr: frenchMessages.messages,
      },
    })
  })

  beforeEach(async () => {
    user = await collections.users.save({
      userName: 'test.account@istio.actually.exists',
      displayName: 'Test Account',
      preferredLang: 'french',
      tfaValidated: false,
      emailValidated: false,
    })

    await collections.aggregateGuidanceTags.save({
      _key: 'aggregate1',
    })
    await collections.aggregateGuidanceTags.save({
      _key: 'aggregate2',
    })
  })

  afterEach(async () => {
    consoleOutput.length = 0
    await truncate()
  })

  afterAll(async () => {
    await drop()
  })

  describe('given a successful load', () => {
    describe('using after cursor', () => {
      it('returns the guidance tags', async () => {})
    })
    describe('using before cursor', () => {
      it('returns the guidance tags', async () => {})
    })
    describe('using the first limit', () => {
      it('returns the guidance tags', async () => {})
    })
    describe('using the last limit', () => {
      it('returns the guidance tags', async () => {})
    })
    describe('using the orderBy field', () => {
      describe('ordering on TAG_ID', () => {
        describe('order is set to ASC', () => {
          it('returns the guidance tags', async () => {})
        })
        describe('order is set to DESC', () => {
          it('returns the guidance tags', async () => {})
        })
      })
      describe('ordering on TAG_NAME', () => {
        describe('order is set to ASC', () => {
          it('returns the guidance tags', async () => {})
        })
        describe('order is set to DESC', () => {
          it('returns the guidance tags', async () => {})
        })
      })
      describe('ordering on GUIDANCE', () => {
        describe('order is set to ASC', () => {
          it('returns the guidance tags', async () => {})
        })
        describe('order is set to DESC', () => {
          it('returns the guidance tags', async () => {})
        })
      })
    })
    describe('no tags are found', () => {
      it('returns an empty structure', async () => {})
    })
  })
  describe('language is set to english', () => {
    describe('given an unsuccessful load', () => {
      describe('both limits are not set', () => {
        it('throws an error', async () => {})
      })
      describe('both limits are set', () => {
        it('throws an error', async () => {})
      })
      describe('limits are below minimum', () => {
        describe('first is set', () => {
          it('throws an error', async () => {})
        })
        describe('last is set', () => {
          it('throws an error', async () => {})
        })
      })
      describe('limits are above minimum', () => {
        describe('first is set', () => {
          it('throws an error', async () => {})
        })
        describe('last is set', () => {
          it('throws an error', async () => {})
        })
      })
      describe('limits are not set to numbers', () => {})
    })
    describe('database error occurs', () => {
      it('throws an error', async () => {})
    })
    describe('cursor error occurs', () => {
      it('throws an error', async () => {})
    })
  })
})
