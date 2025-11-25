import { organizationSummaryType } from '../organization-summary'
import { categorizedSummaryType } from '../../../summaries/objects'

describe('given the organization summary object', () => {
  describe('testing field definitions', () => {
    it('has a dmarc field', () => {
      const demoType = organizationSummaryType.getFields()

      expect(demoType).toHaveProperty('dmarc')
      expect(demoType.dmarc.type).toMatchObject(categorizedSummaryType)
    })
    it('has a https field', () => {
      const demoType = organizationSummaryType.getFields()

      expect(demoType).toHaveProperty('https')
      expect(demoType.https.type).toMatchObject(categorizedSummaryType)
    })
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
    it('has a dmarcPhase field', () => {
      const demoType = organizationSummaryType.getFields()

      expect(demoType).toHaveProperty('dmarcPhase')
      expect(demoType.dmarcPhase.type).toMatchObject(categorizedSummaryType)
    })
    it('has a webConnections field', () => {
      const demoType = organizationSummaryType.getFields()

      expect(demoType).toHaveProperty('webConnections')
      expect(demoType.dmarcPhase.type).toMatchObject(categorizedSummaryType)
    })
    it('has a ssl field', () => {
      const demoType = organizationSummaryType.getFields()

      expect(demoType).toHaveProperty('ssl')
      expect(demoType.dmarcPhase.type).toMatchObject(categorizedSummaryType)
    })
    it('has a spf field', () => {
      const demoType = organizationSummaryType.getFields()

      expect(demoType).toHaveProperty('spf')
      expect(demoType.dmarcPhase.type).toMatchObject(categorizedSummaryType)
    })
    it('has a dkim field', () => {
      const demoType = organizationSummaryType.getFields()

      expect(demoType).toHaveProperty('dkim')
      expect(demoType.dmarcPhase.type).toMatchObject(categorizedSummaryType)
    })
  })

  describe('field resolvers', () => {
    describe('dmarc resolver', () => {
      describe('total is zero', () => {
        it('returns the resolved value', () => {
          const demoType = organizationSummaryType.getFields()

          const dmarc = {
            pass: 0,
            fail: 0,
            total: 0,
          }

          const i18n = {
            _: jest.fn().mockReturnValueOnce('pass').mockReturnValueOnce('fail'),
          }

          expect(demoType.dmarc.resolve({ dmarc }, {}, { i18n })).toEqual({
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

          const dmarc = {
            pass: 50,
            fail: 1000,
            total: 1050,
          }

          const i18n = {
            _: jest.fn().mockReturnValueOnce('pass').mockReturnValueOnce('fail'),
          }

          expect(demoType.dmarc.resolve({ dmarc }, {}, { i18n })).toEqual({
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

    describe('https resolver', () => {
      describe('total is zero', () => {
        it('returns the resolved value', () => {
          const demoType = organizationSummaryType.getFields()

          const https = {
            pass: 0,
            fail: 0,
            total: 0,
          }

          const i18n = {
            _: jest.fn().mockReturnValueOnce('pass').mockReturnValueOnce('fail'),
          }

          expect(demoType.https.resolve({ https }, {}, { i18n })).toEqual({
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

          const https = {
            pass: 50,
            fail: 1000,
            total: 1050,
          }

          const i18n = {
            _: jest.fn().mockReturnValueOnce('pass').mockReturnValueOnce('fail'),
          }

          expect(demoType.https.resolve({ https }, {}, { i18n })).toEqual({
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
            _: jest.fn().mockReturnValueOnce('pass').mockReturnValueOnce('fail'),
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
            _: jest.fn().mockReturnValueOnce('pass').mockReturnValueOnce('fail'),
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
            _: jest.fn().mockReturnValueOnce('pass').mockReturnValueOnce('fail'),
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
            _: jest.fn().mockReturnValueOnce('pass').mockReturnValueOnce('fail'),
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
    describe('testing dmarcPhase resolver', () => {
      describe('total is zero', () => {
        it('returns the resolved value', () => {
          const demoType = organizationSummaryType.getFields()

          const dmarcPhase = {
            assess: 0,
            deploy: 0,
            enforce: 0,
            maintain: 0,
            total: 0,
          }

          const i18n = {
            _: jest
              .fn()
              .mockReturnValueOnce('assess')
              .mockReturnValueOnce('deploy')
              .mockReturnValueOnce('enforce')
              .mockReturnValueOnce('maintain'),
          }

          expect(demoType.dmarcPhase.resolve({ dmarc_phase: dmarcPhase }, {}, { i18n })).toEqual({
            categories: [
              {
                count: 0,
                name: 'assess',
                percentage: 0,
              },
              {
                count: 0,
                name: 'deploy',
                percentage: 0,
              },
              {
                count: 0,
                name: 'enforce',
                percentage: 0,
              },
              {
                count: 0,
                name: 'maintain',
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

          const dmarcPhase = {
            assess: 75,
            deploy: 100,
            enforce: 125,
            maintain: 200,
            total: 500,
          }

          const i18n = {
            _: jest
              .fn()
              .mockReturnValueOnce('assess')
              .mockReturnValueOnce('deploy')
              .mockReturnValueOnce('enforce')
              .mockReturnValueOnce('maintain'),
          }

          expect(demoType.dmarcPhase.resolve({ dmarc_phase: dmarcPhase }, {}, { i18n })).toEqual({
            categories: [
              {
                count: 75,
                name: 'assess',
                percentage: 15.0,
              },
              {
                count: 100,
                name: 'deploy',
                percentage: 20.0,
              },
              {
                count: 125,
                name: 'enforce',
                percentage: 25.0,
              },
              {
                count: 200,
                name: 'maintain',
                percentage: 40.0,
              },
            ],
            total: 500,
          })
        })
      })
    })
  })
})
