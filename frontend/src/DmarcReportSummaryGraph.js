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
      name: "Name to appear on badge"
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

  const formatTicks = (tick) => {
    return `${tick * 100}%`
  }

  // Create date entry for x-axis data keys (e.g.: 'JAN-19')
  // TODO: Should we just be receiving the data in this format?
  periods.forEach((period) => {
    period.date =
      period.month === 'LAST30DAYS'
        ? period.month
        : `${period.month.slice(0, 3)}-${period.year.toString().slice(-2)}`
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
            tickFormatter={formatTicks}
            domain={[0, 1]}
          />
          <Tooltip />
          <Legend
            align="center"
            margin={{ top: 0, left: 0, right: 0, bottom: 0 }}
          />
          {Object.entries(strengths).map(([strengthName, strengthDetails]) => {
            return strengthDetails.types.map((type) => {
              return (
                <Bar
                  key={`Bar:${type}`}
                  dataKey={type}
                  stackId="a"
                  fill={colors[strengthName]}
                  name={strengthDetails.name}
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
