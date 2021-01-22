import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { object, number } from 'prop-types'
import WithPseudoBox from './withPseudoBox'
import theme from './theme/canada'
import { Box } from '@chakra-ui/core'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import CustomTooltipContent from './CustomTooltipContent'

/*
scheme for const data:
**strength options: 'strong', 'moderate', 'weak'. Omitted strengths are ignored
{
  periods: [
    {month: STRING, year: INT, property: INT, property: INT, property: INT...},
    {month: STRING, year: INT, property: INT, property: INT, property: INT...},
    {...}
  ],
  strengths: {
    strong: {
      name: "Name to appear to user"
      types: [
        "property from periods that are 'strong' ",
        "property from periods that that are 'strong' ",
      ]
    },
    moderate: {same as strong},
    weak: {same as strong},
  }
}
*/

function DmarcReportSummaryGraph({ ...props }) {
  const { data, responsiveWidth } = props
  const { periods, strengths } = data
  const ticks = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
  const { colors } = theme
  const { i18n } = useLingui()

  const formatYAxisTicks = (tick) => {
    return `${tick * 100}%`
  }

  // Sort dates
  periods.sort((a, b) => {
    if (a.month === 'LAST30DAYS') return 1
    if (b.month === 'LAST30DAYS') return -1
    const aDate = new Date(`${a.month} 1, ${a.year}`)
    const bDate = new Date(`${b.month} 1, ${b.year}`)
    return aDate - bDate
  })

  // Format dates
  periods.forEach((period) => {
    let date
    period.month === 'LAST30DAYS'
      ? (date = t`L-30-D`)
      : (date = new Date(`${period.month} 1, ${period.year}`)
          .toLocaleDateString(i18n.locale, { month: 'short', year: '2-digit' })
          .replace(/ /, '-'))
    period.date = date
  })

  return (
    <Box overflow="hidden">
      {/* Need to allow ResponsiveContainer width as a set number for tests to work */}
      <ResponsiveContainer height={500} width={responsiveWidth || '100%'}>
        <BarChart
          barSize="30px"
          data={periods}
          margin={{
            top: 25,
            bottom: 25,
          }}
          stackOffset="expand"
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" padding={{ left: 5, right: 5 }} />
          <YAxis
            padding={{ top: 25, bottom: 10 }}
            ticks={ticks}
            tickFormatter={formatYAxisTicks}
            domain={[0, 1]}
          />
          <Tooltip
            formatter={(value, _name, _props) =>
              value.toLocaleString(i18n.locale)
            }
            content={CustomTooltipContent}
            calculatePercentages={true}
            isAnimationActive={false}
          />
          <Legend
            align="center"
            margin={{ top: 0, left: 0, right: 0, bottom: 0 }}
          />
          {Object.entries(strengths).map(([strengthName, strengthDetails]) => {
            return strengthDetails.map((type) => {
              return (
                <Bar
                  key={`Bar:${type.name}`}
                  dataKey={type.name}
                  stackId="a"
                  fill={colors[strengthName]}
                  name={type.displayName}
                />
              )
            })
          })}
        </BarChart>
      </ResponsiveContainer>
    </Box>
  )
}

DmarcReportSummaryGraph.propTypes = {
  data: object.isRequired,
  responsiveWidth: number,
}

export default WithPseudoBox(DmarcReportSummaryGraph)
