import { organizationSummaryType } from '../organization-summary'
import { categorizedSummaryType } from '../../../summaries/objects'

describe('given the organization summary object', () => {
  describe('testing field definitions', () => {
    it('has a mail field', () => {
      const demoType = organizationSummaryType.getFields()

      expect(demoType).toHaveProperty('mail')
      expect(demoType.mail.type).toMatchObject(categorizedSummaryType)
    })
    it('has a web field', () => {
      const demoType = organizationSummaryType.getFields()

      expect(demoType).toHaveProperty('web')
      expect(demoType.web.type).toMatchObject(categorizedSummaryType)
    })
  })

  describe('field resolvers', () => {
    describe('mail resolver', () => {
      describe('total is zero', () => {
        it('returns the resolved value', () => {
          const demoType = organizationSummaryType.getFields()

          const mail = {
            pass: 0,
            fail: 0,
            total: 0,
          }

          const i18n = {
            _: jest
              .fn()
              .mockReturnValueOnce('pass')
              .mockReturnValueOnce('fail'),
          }

          expect(demoType.mail.resolve({ mail }, {}, { i18n })).toEqual({
            categories: [
              {
                count: 0,
                name: 'pass',
                percentage: 0,
              },
              {
                count: 0,
                name: 'fail',
                percentage: 0,
              },
            ],
            total: 0,
          })
        })
      })

      describe('when total is greater then zero', () => {
        it('returns the resolved value', () => {
          const demoType = organizationSummaryType.getFields()

          const mail = {
            pass: 50,
            fail: 1000,
            total: 1050,
          }

          const i18n = {
            _: jest
              .fn()
              .mockReturnValueOnce('pass')
              .mockReturnValueOnce('fail'),
          }

          expect(demoType.mail.resolve({ mail }, {}, { i18n })).toEqual({
            categories: [
              {
                count: 50,
                name: 'pass',
                percentage: 4.8,
              },
              {
                count: 1000,
                name: 'fail',
                percentage: 95.2,
              },
            ],
            total: 1050,
          })
        })
      })
    })
    describe('testing web resolver', () => {
      describe('total is zero', () => {
        it('returns the resolved value', () => {
          const demoType = organizationSummaryType.getFields()

          const web = {
            pass: 0,
            fail: 0,
            total: 0,
          }

          const i18n = {
            _: jest
              .fn()
              .mockReturnValueOnce('pass')
              .mockReturnValueOnce('fail'),
          }

          expect(demoType.web.resolve({ web }, {}, { i18n })).toEqual({
            categories: [
              {
                count: 0,
                name: 'pass',
                percentage: 0,
              },
              {
                count: 0,
                name: 'fail',
                percentage: 0,
              },
            ],
            total: 0,
          })
        })
      })
      describe('total is greater then zero', () => {
        it('returns the resolved value', () => {
          const demoType = organizationSummaryType.getFields()

          const web = {
            pass: 50,
            fail: 1000,
            total: 1050,
          }

          const i18n = {
            _: jest
              .fn()
              .mockReturnValueOnce('pass')
              .mockReturnValueOnce('fail'),
          }

          expect(demoType.web.resolve({ web }, {}, { i18n })).toEqual({
            categories: [
              {
                count: 50,
                name: 'pass',
                percentage: 4.8,
              },
              {
                count: 1000,
                name: 'fail',
                percentage: 95.2,
              },
            ],
            total: 1050,
          })
        })
      })
    })
  })
})
