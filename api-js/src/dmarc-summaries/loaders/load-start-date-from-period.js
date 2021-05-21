import { t } from '@lingui/macro'

export const loadStartDateFromPeriod = ({ moment, userKey, i18n }) => ({
  period,
  year,
}) => {
  const monthMap = {
    january: '01',
    february: '02',
    march: '03',
    april: '04',
    may: '05',
    june: '06',
    july: '07',
    august: '08',
    september: '09',
    october: '10',
    november: '11',
    december: '12',
  }

  if (period === 'thirtyDays') {
    const startDate = moment().subtract(30, 'days')
    const currentDate = moment()

    if (
      year !== String(startDate.year()) &&
      year !== String(currentDate.year())
    ) {
      console.warn(
        `User: ${userKey} attempted to load startDate that is out of range period: ${period}, year: ${year}`,
      )
      throw new Error(
        i18n._(t`Unable to select DMARC report(s) for this period and year.`),
      )
    }

    return 'thirtyDays'
  } else {
    const startDate = moment(`${year}-${monthMap[period]}-01`)
    const currentMonth = moment().startOf('month')
    const lastYearMonth = moment().subtract(1, 'year').startOf('month')

    if (!startDate.isBetween(lastYearMonth, currentMonth, undefined, '[]')) {
      console.warn(
        `User: ${userKey} attempted to load startDate that is out of range period: ${period}, year: ${year}`,
      )
      throw new Error(
        i18n._(t`Unable to select DMARC report(s) for this period and year.`),
      )
    }

    return startDate.format('YYYY-MM-DD')
  }
}
