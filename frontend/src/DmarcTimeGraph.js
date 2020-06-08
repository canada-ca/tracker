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

import { object } from 'prop-types'
import WithPseudoBox from './withPseudoBox'

function DmarcTimeGraph({ data }) {
  const { periods, strengths } = data

  return (
    <ResponsiveContainer height={500}>
      <BarChart
        barSize="30px"
        data={periods}
        margin={{
          top: 25,
          bottom: 25,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" padding={{ left: 5, right: 5 }} />
        <YAxis padding={{ top: 25, bottom: 10 }} /> <Tooltip />
        <Legend
          align="center"
          margin={{ top: 0, left: 0, right: 0, bottom: 0 }}
        />
        {Object.entries(strengths).map(([strengthName, strengthDetails]) => {
          let color
          switch (strengthName) {
            case 'strong':
              color = '#2D8133'
              break
            case 'moderate':
              color = '#ffbf47'
              break
            case 'weak':
              color = '#e53e3e'
          }
          return strengthDetails.types.map((type) => {
            return <Bar dataKey={type} stackId="a" fill={color} />
          })
        })}
      </BarChart>
    </ResponsiveContainer>
  )
}

DmarcTimeGraph.propTypes = {
  data: object.isRequired,
}

export default WithPseudoBox(DmarcTimeGraph)
