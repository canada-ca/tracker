import crypto from 'crypto'
import { ensure, dbNameFromFile } from 'arango-tools'
import {
  GraphQLNonNull,
  GraphQLID,
  GraphQLString,
  GraphQLBoolean,
} from 'graphql'
import { toGlobalId } from 'graphql-relay'
import { GraphQLEmailAddress, GraphQLPhoneNumber } from 'graphql-scalars'

import { databaseOptions } from '../../../../database-options'
import { affiliationConnectionLoaderByUserId } from '../../../affiliation/loaders'
import { cleanseInput } from '../../../validators'
import { affiliationConnection } from '../../../affiliation/objects'
import { userPersonalType } from '../index'
import { LanguageEnums, TfaSendMethodEnum } from '../../../enums'

const { DB_PASS: rootPass, DB_URL: url, CIPHER_KEY } = process.env

describe('given the user object', () => {
  describe('testing the field definitions', () => {
    it('has an id field', () => {
      const demoType = userPersonalType.getFields()

      expect(demoType).toHaveProperty('id')
      expect(demoType.id.type).toMatchObject(GraphQLNonNull(GraphQLID))
    })
    it('has a userName field', () => {
      const demoType = userPersonalType.getFields()

      expect(demoType).toHaveProperty('userName')
      expect(demoType.userName.type).toMatchObject(GraphQLEmailAddress)
    })
    it('has a displayName field', () => {
      const demoType = userPersonalType.getFields()

      expect(demoType).toHaveProperty('displayName')
      expect(demoType.displayName.type).toMatchObject(GraphQLString)
    })
    it('has a phoneNumber field', () => {
      const demoType = userPersonalType.getFields()

      expect(demoType).toHaveProperty('phoneNumber')
      expect(demoType.phoneNumber.type).toMatchObject(GraphQLPhoneNumber)
    })
    it('has a preferredLang field', () => {
      const demoType = userPersonalType.getFields()

      expect(demoType).toHaveProperty('preferredLang')
      expect(demoType.preferredLang.type).toMatchObject(LanguageEnums)
    })
    it('has a phoneValidated field', () => {
      const demoType = userPersonalType.getFields()

      expect(demoType).toHaveProperty('phoneValidated')
      expect(demoType.phoneValidated.type).toMatchObject(GraphQLBoolean)
    })
    it('has a emailValidated field', () => {
      const demoType = userPersonalType.getFields()

      expect(demoType).toHaveProperty('emailValidated')
      expect(demoType.emailValidated.type).toMatchObject(GraphQLBoolean)
    })
    it('has a tfaSendMethod field', () => {
      const demoType = userPersonalType.getFields()

      expect(demoType).toHaveProperty('tfaSendMethod')
      expect(demoType.tfaSendMethod.type).toMatchObject(TfaSendMethodEnum)
    })
    it('has an affiliations field', () => {
      const demoType = userPersonalType.getFields()

      expect(demoType).toHaveProperty('affiliations')
      expect(demoType.affiliations.type).toMatchObject(
        affiliationConnection.connectionType,
      )
    })
  })

  describe('testing the field resolvers', () => {
    let query, drop, truncate, collections, user, org, affiliation

    beforeAll(async () => {
      // Generate DB Items
      ;({ query, drop, truncate, collections } = await ensure({
        type: 'database',
        name: dbNameFromFile(__filename),
        url,
        rootPassword: rootPass,
        options: databaseOptions({ rootPass }),
      }))
    })

    beforeEach(async () => {
      user = await collections.users.save({
        userName: 'test.account@istio.actually.exists',
        displayName: 'Test Account',
        preferredLang: 'french',
        tfaValidated: false,
        emailValidated: false,
      })
      org = await collections.organizations.save({
        verified: false,
        summaries: {
          web: {
            pass: 50,
            fail: 1000,
            total: 1050,
          },
          mail: {
            pass: 50,
            fail: 1000,
            total: 1050,
          },
        },
        orgDetails: {
          en: {
            slug: 'treasury-board-secretariat',
            acronym: 'TBS',
            name: 'Treasury Board of Canada Secretariat',
            zone: 'FED',
            sector: 'TBS',
            country: 'Canada',
            province: 'Ontario',
            city: 'Ottawa',
          },
          fr: {
            slug: 'secretariat-conseil-tresor',
            acronym: 'SCT',
            name: 'Secrétariat du Conseil Trésor du Canada',
            zone: 'FED',
            sector: 'TBS',
            country: 'Canada',
            province: 'Ontario',
            city: 'Ottawa',
          },
        },
      })
      affiliation = await collections.affiliations.save({
        _to: user._id,
        _from: org._id,
        permission: 'user',
      })
    })

    afterEach(async () => {
      await truncate()
    })

    afterAll(async () => {
      await drop()
    })

    describe('testing the id resolver', () => {
      it('returns the resolved field', () => {
        const demoType = userPersonalType.getFields()

        expect(demoType.id.resolve({ id: '1' })).toEqual(
          toGlobalId('users', '1'),
        )
      })
    })
    describe('testing the userName field', () => {
      it('returns the resolved value', () => {
        const demoType = userPersonalType.getFields()

        expect(
          demoType.userName.resolve({ userName: 'test@email.gc.ca' }),
        ).toEqual('test@email.gc.ca')
      })
    })
    describe('testing the displayName field', () => {
      it('returns the resolved value', () => {
        const demoType = userPersonalType.getFields()

        expect(
          demoType.displayName.resolve({ displayName: 'display name' }),
        ).toEqual('display name')
      })
    })
    describe('testing the phoneNumber field', () => {
      describe('testing undefined phoneDetails', () => {
        it('returns null', () => {
          const demoType = userPersonalType.getFields()

          const phoneDetails = undefined

          expect(
            demoType.phoneNumber.resolve({
              phoneDetails,
            }),
          ).toEqual(null)
        })
      })
      describe('testing null phoneDetails', () => {
        it('returns null', () => {
          const demoType = userPersonalType.getFields()

          const phoneDetails = null

          expect(
            demoType.phoneNumber.resolve({
              phoneDetails,
            }),
          ).toEqual(null)
        })
      })
      describe('testing defined phoneDetails', () => {
        it('returns the resolved value', () => {
          const demoType = userPersonalType.getFields()

          const phoneDetails = {
            iv: crypto.randomBytes(12).toString('hex'),
            phoneNumber: '12345678912',
          }

          const cipher = crypto.createCipheriv(
            'aes-256-ccm',
            String(CIPHER_KEY),
            Buffer.from(phoneDetails.iv, 'hex'),
            {
              authTagLength: 16,
            },
          )
          let encrypted = cipher.update(phoneDetails.phoneNumber, 'utf8', 'hex')
          encrypted += cipher.final('hex')

          expect(
            demoType.phoneNumber.resolve({
              phoneDetails: {
                phoneNumber: encrypted,
                iv: phoneDetails.iv,
                tag: cipher.getAuthTag().toString('hex'),
              },
            }),
          ).toEqual(phoneDetails.phoneNumber)
        })
      })
    })
    describe('testing the preferredLang field', () => {
      it('returns the resolved value', () => {
        const demoType = userPersonalType.getFields()

        expect(
          demoType.preferredLang.resolve({ preferredLang: 'english' }),
        ).toEqual('english')
      })
    })
    describe('testing the phoneValidated field', () => {
      it('returns the resolved value', () => {
        const demoType = userPersonalType.getFields()

        expect(
          demoType.phoneValidated.resolve({ phoneValidated: true }),
        ).toEqual(true)
      })
    })
    describe('testing the emailValidated field', () => {
      it('returns the resolved value', () => {
        const demoType = userPersonalType.getFields()

        expect(
          demoType.emailValidated.resolve({ emailValidated: true }),
        ).toEqual(true)
      })
    })
    describe('testing the tfaSendMethod field', () => {
      it('returns the resolved value', () => {
        const demoType = userPersonalType.getFields()

        expect(
          demoType.tfaSendMethod.resolve({ tfaSendMethod: 'phone' }),
        ).toEqual('phone')
      })
    })
    describe('testing the affiliations field', () => {
      it('returns the resolved value', async () => {
        const demoType = userPersonalType.getFields()

        const loader = affiliationConnectionLoaderByUserId(
          query,
          user._key,
          cleanseInput,
          {},
        )

        const expectedResult = {
          edges: [
            {
              cursor: toGlobalId('affiliations', affiliation._key),
              node: {
                _from: org._id,
                _id: affiliation._id,
                _key: affiliation._key,
                _rev: affiliation._rev,
                _to: user._id,
                _type: 'affiliation',
                id: affiliation._key,
                orgKey: org._key,
                permission: 'user',
                userKey: user._key,
              },
            },
          ],
          totalCount: 1,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('affiliations', affiliation._key),
            endCursor: toGlobalId('affiliations', affiliation._key),
          },
        }

        await expect(
          demoType.affiliations.resolve(
            { _id: user._id },
            { first: 1 },
            { loaders: { affiliationConnectionLoaderByUserId: loader } },
          ),
        ).resolves.toEqual(expectedResult)
      })
    })
  })
})
