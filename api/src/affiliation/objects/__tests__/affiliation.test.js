import { GraphQLNonNull, GraphQLID } from 'graphql'
import { toGlobalId } from 'graphql-relay'

import { affiliationType } from '../affiliation'
import { organizationType } from '../../../organization/objects'
import { RoleEnums } from '../../../enums'
import { userSharedType } from '../../../user/objects'

describe('given the user affiliation object', () => {
  describe('testing the field definitions', () => {
    it('has an id field', () => {
      const demoType = affiliationType.getFields()

      expect(demoType).toHaveProperty('id')
      expect(demoType.id.type).toMatchObject(new GraphQLNonNull(GraphQLID))
    })
    it('has a permission field', () => {
      const demoType = affiliationType.getFields()

      expect(demoType).toHaveProperty('permission')
      expect(demoType.permission.type).toMatchObject(RoleEnums)
    })
    it('has a user field', () => {
      const demoType = affiliationType.getFields()

      expect(demoType).toHaveProperty('user')
      expect(demoType.user.type).toMatchObject(userSharedType)
    })
    it('has an organization field', () => {
      const demoType = affiliationType.getFields()

      expect(demoType).toHaveProperty('organization')
      expect(demoType.organization.type).toMatchObject(organizationType)
    })
  })

  describe('testing the field resolvers', () => {
    describe('testing the id resolver', () => {
      it('returns the resolved value', () => {
        const demoType = affiliationType.getFields()

        expect(demoType.id.resolve({ id: '1' })).toEqual(toGlobalId('affiliation', '1'))
      })
    })
    describe('testing the permission resolver', () => {
      it('returns the resolved value', () => {
        const demoType = affiliationType.getFields()

        expect(demoType.permission.resolve({ permission: 'admin' })).toEqual('admin')
      })
    })
    describe('testing the user resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = affiliationType.getFields()

        const expectedResult = {
          _id: 'users/1',
          _key: '1',
          _rev: 'rev',
          _type: 'user',
          id: '1',
          displayName: 'Test Account',
          emailValidated: false,
          tfaValidated: false,
          userName: 'test.account@istio.actually.exists',
        }

        await expect(
          demoType.user.resolve(
            { _to: 'users/1' },
            {},
            {
              loaders: {
                loadUserByKey: {
                  load: jest.fn().mockReturnValue(expectedResult),
                },
              },
            },
          ),
        ).resolves.toEqual(expectedResult)
      })
    })
    describe('testing the organization resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = affiliationType.getFields()

        const expectedResult = {
          _id: 'organizations/1',
          _key: '1',
          _rev: 'rev',
          _type: 'organization',
          acronym: 'TBS',
          city: 'Ottawa',
          country: 'Canada',
          domainCount: 0,
          id: '1',
          name: 'Treasury Board of Canada Secretariat',
          province: 'Ontario',
          sector: 'TBS',
          slug: 'treasury-board-secretariat',
          summaries: {
            mail: {
              fail: 1000,
              pass: 50,
              total: 1050,
            },
            web: {
              fail: 1000,
              pass: 50,
              total: 1050,
            },
          },
          verified: false,
          zone: 'FED',
        }

        await expect(
          demoType.organization.resolve(
            { _from: '1' },
            {},
            {
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue(expectedResult),
                },
              },
            },
          ),
        ).resolves.toEqual(expectedResult)
      })
    })
  })
})
