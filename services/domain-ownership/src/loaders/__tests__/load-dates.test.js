const moment = require('moment')
const { stringify } = require('jest-matcher-utils')
const { loadDates } = require('../load-dates')

describe('given the date range function', () => {
  let consoleOutput = []
  const mockedWarn = (output) => consoleOutput.push(output)
  beforeEach(() => {
    console.warn = mockedWarn
    consoleOutput = []
  })

  describe('given a successful call', () => {
    it('returns the twelve months', () => {
      const dateLoader = loadDates(moment)
      const dates = dateLoader({
        startDate: '2020-01-01',
      })
      const expectedDates = [
        {
          startDate: '2020-01-01',
        },
        {
          startDate: '2020-02-01',
        },
        {
          startDate: '2020-03-01',
        },
        {
          startDate: '2020-04-01',
        },
        {
          startDate: '2020-05-01',
        },
        {
          startDate: '2020-06-01',
        },
        {
          startDate: '2020-07-01',
        },
        {
          startDate: '2020-08-01',
        },
        {
          startDate: '2020-09-01',
        },
        {
          startDate: '2020-10-01',
        },
        {
          startDate: '2020-11-01',
        },
        {
          startDate: '2020-12-01',
        },
        {
          startDate: '2021-01-01',
        },
      ]
      expect(dates).toEqual(expectedDates)
    })
  })
  describe('given an unsuccessful return', () => {
    describe('startDate is not a string', () => {
      const dateLoader = loadDates(moment)
      ;[123, {}, [], null, undefined, true].forEach((invalidInput) => {
        it(`throws an error when generating dates ${stringify(
          invalidInput,
        )}`, () => {
          expect(() =>
            dateLoader({ startDate: invalidInput, endDate: '' }),
          ).toThrow(
            new Error('Start date is not a valid string. Please try again.'),
          )
          expect(consoleOutput).toEqual([
            `Error: startDate for dateRange must be of type string, instead: startDate: ${typeof invalidInput}`,
          ])
        })
      })
    })
    describe('startDate does not match format of YYYY-MM-DD', () => {
      it('throws an error', () => {
        const dateLoader = loadDates(moment)
        expect(() =>
          dateLoader({ startDate: 'string'}),
        ).toThrow(
          new Error(
            'Start date is not a valid format, please conform to YYYY-MM-DD. Please try again.',
          ),
        )
        expect(consoleOutput).toEqual([
          `Error: startDate for dateRange must conform to format: YYYY-MM-DD, instead: startDate: string`,
        ])
      })
    })
  })
})
