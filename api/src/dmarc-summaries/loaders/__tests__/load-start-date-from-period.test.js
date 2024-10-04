import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { loadStartDateFromPeriod } from '../load-start-date-from-period'

describe('given the loadStartDateFromPeriod', () => {
  let i18n
  const consoleOutput = []
  const mockedWarn = (output) => consoleOutput.push(output)
  beforeAll(() => {
    console.warn = mockedWarn
  })

  afterEach(() => {
    consoleOutput.length = 0
  })

  describe('given a valid period and year', () => {
    describe('given the period is not thirty days', () => {
      let mockedMoment
      beforeAll(() => {
        mockedMoment = jest
          .fn()
          .mockReturnValueOnce({
            isBetween() {
              return true
            },
            format() {
              return '2020-01-01'
            },
          })
          .mockReturnValueOnce({
            startOf() {
              return '2020-01-01'
            },
          })
          .mockReturnValueOnce({
            subtract() {
              return {
                startOf() {
                  return '2019-01-01'
                },
              }
            },
          })
      })
      it('returns the start date', () => {
        const loader = loadStartDateFromPeriod({ moment: mockedMoment })

        const startDate = loader({ period: 'january', year: '2020' })

        expect(startDate).toEqual('2020-01-01')
      })
    })
    describe('given the period is thirty days', () => {
      let mockedMoment
      beforeAll(() => {
        mockedMoment = jest
          .fn()
          .mockReturnValueOnce({
            subtract() {
              return {
                year() {
                  return '2020'
                },
              }
            },
          })
          .mockReturnValueOnce({
            year() {
              return '2020'
            },
          })
      })
      it('returns thirty days', () => {
        const loader = loadStartDateFromPeriod({ moment: mockedMoment })

        const startDate = loader({ period: 'thirtyDays', year: '2020' })

        expect(startDate).toEqual('thirtyDays')
      })
    })
  })
  describe('language is set to english', () => {
    beforeAll(() => {
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
    describe('given an unsuccessful load', () => {
      describe('period and year are not in the correct range', () => {
        describe('period is not thirty days', () => {
          let mockedMoment
          beforeAll(() => {
            mockedMoment = jest
              .fn()
              .mockReturnValueOnce({
                isBetween() {
                  return false
                },
                format() {
                  return '2020-01-01'
                },
              })
              .mockReturnValueOnce({
                startOf() {
                  return '2020-01-01'
                },
              })
              .mockReturnValueOnce({
                subtract() {
                  return {
                    startOf() {
                      return '2019-01-01'
                    },
                  }
                },
              })
          })
          it('throws an error', () => {
            const loader = loadStartDateFromPeriod({
              moment: mockedMoment,
              userKey: '123',
              i18n,
            })
            try {
              loader({ period: 'january', year: '2021' })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  'Unable to select DMARC report(s) for this period and year.',
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User: 123 attempted to load startDate that is out of range period: january, year: 2021`,
            ])
          })
        })
        describe('period is thirty days', () => {
          let mockedMoment
          beforeAll(() => {
            mockedMoment = jest
              .fn()
              .mockReturnValueOnce({
                subtract() {
                  return {
                    year() {
                      return '2019'
                    },
                  }
                },
              })
              .mockReturnValueOnce({
                year() {
                  return '2020'
                },
              })
          })
          it('throws an error', () => {
            const loader = loadStartDateFromPeriod({
              moment: mockedMoment,
              userKey: '123',
              i18n,
            })
            try {
              loader({ period: 'thirtyDays', year: '2021' })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  'Unable to select DMARC report(s) for this period and year.',
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User: 123 attempted to load startDate that is out of range period: thirtyDays, year: 2021`,
            ])
          })
        })
      })
    })
  })
  describe('language is set to english', () => {
    beforeAll(() => {
      i18n = setupI18n({
        locale: 'fr',
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
    describe('given an unsuccessful load', () => {
      describe('period and year are not in the correct range', () => {
        describe('period is not thirty days', () => {
          let mockedMoment
          beforeAll(() => {
            mockedMoment = jest
              .fn()
              .mockReturnValueOnce({
                isBetween() {
                  return false
                },
                format() {
                  return '2020-01-01'
                },
              })
              .mockReturnValueOnce({
                startOf() {
                  return '2020-01-01'
                },
              })
              .mockReturnValueOnce({
                subtract() {
                  return {
                    startOf() {
                      return '2019-01-01'
                    },
                  }
                },
              })
          })
          it('throws an error', () => {
            const loader = loadStartDateFromPeriod({
              moment: mockedMoment,
              userKey: '123',
              i18n,
            })
            try {
              loader({ period: 'january', year: '2021' })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  'Impossible de sélectionner le(s) rapport(s) DMARC pour cette période et cette année.',
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User: 123 attempted to load startDate that is out of range period: january, year: 2021`,
            ])
          })
        })
        describe('period is thirty days', () => {
          let mockedMoment
          beforeAll(() => {
            mockedMoment = jest
              .fn()
              .mockReturnValueOnce({
                subtract() {
                  return {
                    year() {
                      return '2019'
                    },
                  }
                },
              })
              .mockReturnValueOnce({
                year() {
                  return '2020'
                },
              })
          })
          it('throws an error', () => {
            const loader = loadStartDateFromPeriod({
              moment: mockedMoment,
              userKey: '123',
              i18n,
            })
            try {
              loader({ period: 'thirtyDays', year: '2021' })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  'Impossible de sélectionner le(s) rapport(s) DMARC pour cette période et cette année.',
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User: 123 attempted to load startDate that is out of range period: thirtyDays, year: 2021`,
            ])
          })
        })
      })
    })
  })
})
