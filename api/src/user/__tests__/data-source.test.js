import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../testUtilities'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../locale/en/messages'
import frenchMessages from '../../locale/fr/messages'
import { cleanseInput } from '../../validators'
import { collectionNames } from '../../collection-names'
import { UserDataSource } from '../data-source'
import dbschema from '../../../database.json'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the UserDataSource', () => {
  let query, drop, truncate, collections, transaction, i18n

  const consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)

  beforeAll(async () => {
    console.info = mockedInfo
    console.warn = mockedWarn
    console.error = mockedError
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
    ;({ query, drop, truncate, collections, transaction } = await ensure({
      variables: {
        dbname: dbNameFromFile(__filename),
        username: 'root',
        rootPassword: rootPass,
        password: rootPass,
        url,
      },
      schema: dbschema,
    }))
  })
  afterEach(async () => {
    consoleOutput.length = 0
    await truncate()
  })
  afterAll(async () => {
    await drop()
  })

  const makeDataSource = ({ userKey = 'NO_USER' } = {}) =>
    new UserDataSource({
      query,
      userKey,
      i18n,
      language: 'en',
      cleanseInput,
      transaction,
      collections: collectionNames,
    })

  describe('loader properties', () => {
    it('byKey loads a user by key', async () => {
      const insertedUser = await collections.users.save({
        userName: 'test.account@istio.actually.exists',
        displayName: 'Test Account',
      })

      const userDataSource = makeDataSource()
      const user = await userDataSource.byKey.load(insertedUser._key)

      expect(user.userName).toEqual('test.account@istio.actually.exists')
    })

    it('byUserName loads a user by user name', async () => {
      await collections.users.save({
        userName: 'test.account@istio.actually.exists',
        displayName: 'Test Account',
      })

      const userDataSource = makeDataSource()
      const user = await userDataSource.byUserName.load('test.account@istio.actually.exists')

      expect(user.displayName).toEqual('Test Account')
    })
  })

  describe('create', () => {
    it('inserts a new user and returns it', async () => {
      const userDataSource = makeDataSource()

      const insertedUser = await userDataSource.create({
        user: {
          displayName: 'New User',
          userName: 'new.user@istio.actually.exists',
          password: 'hashed-password',
        },
      })

      expect(insertedUser.userName).toEqual('new.user@istio.actually.exists')

      const checkCursor = await query`
        FOR user IN users
          FILTER user.userName == "new.user@istio.actually.exists"
          RETURN user
      `
      const checkUser = await checkCursor.next()
      expect(checkUser).toBeDefined()
    })

    it('inserts an affiliation edge when one is provided', async () => {
      const org = await collections.organizations.save({ verified: false })
      const userDataSource = makeDataSource()

      const insertedUser = await userDataSource.create({
        user: {
          displayName: 'New User',
          userName: 'affiliated.user@istio.actually.exists',
          password: 'hashed-password',
        },
        affiliation: { orgId: org._id, permission: 'admin' },
      })

      const affiliationCursor = await query`
        FOR aff IN affiliations
          FILTER aff._to == ${insertedUser._id}
          RETURN aff
      `
      const affiliation = await affiliationCursor.next()
      expect(affiliation.permission).toEqual('admin')
    })

    describe('transaction step fails', () => {
      it('throws an error', async () => {
        const userDataSource = makeDataSource()
        userDataSource._transaction = jest.fn().mockReturnValue({
          step: jest.fn().mockRejectedValue(new Error('trx step error')),
          abort: jest.fn(),
        })

        await expect(userDataSource.create({ user: { userName: 'fail@istio.actually.exists' } })).rejects.toEqual(
          new Error('Unable to sign up. Please try again.'),
        )
      })
    })
  })

  describe('removeUserAndAffiliations', () => {
    it('removes the user and their affiliations', async () => {
      const insertedUser = await collections.users.save({ userName: 'remove.me@istio.actually.exists' })
      const org = await collections.organizations.save({ verified: false })
      await collections.affiliations.save({
        _from: org._id,
        _to: insertedUser._id,
        permission: 'admin',
      })

      const userDataSource = makeDataSource()
      await userDataSource.removeUserAndAffiliations({ userId: insertedUser._id })

      const userCursor = await query`
        FOR user IN users
          FILTER user._key == ${insertedUser._key}
          RETURN user
      `
      expect(await userCursor.hasNext).toBeDefined()
      expect(await userCursor.all()).toEqual([])

      const affCursor = await query`
        FOR aff IN affiliations
          FILTER aff._to == ${insertedUser._id}
          RETURN aff
      `
      expect(await affCursor.all()).toEqual([])
    })
  })

  describe('updatePassword', () => {
    it('updates the users password', async () => {
      const insertedUser = await collections.users.save({
        userName: 'update.password@istio.actually.exists',
        password: 'old-password',
      })

      const userDataSource = makeDataSource()
      await userDataSource.updatePassword({ userKey: insertedUser._key, hashedPassword: 'new-password' })

      const checkCursor = await query`
        FOR user IN users
          FILTER user._key == ${insertedUser._key}
          RETURN user.password
      `
      expect(await checkCursor.next()).toEqual('new-password')
    })
  })
})
