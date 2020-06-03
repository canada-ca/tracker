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

import { array } from 'prop-types'
import WithPseudoBox from './withPseudoBox'

function DmarcTimeGraph({ data }) {
  return (
    <ResponsiveContainer height={500}>
      <BarChart
        barSize="30px"
        data={data}
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
        <Bar dataKey="spfPassDkimPass" stackId="a" fill="#2D8133" />
        <Bar dataKey="spfFailDkimPass" stackId="a" fill="#ffbf47" />
        <Bar dataKey="spfPassDkimFail" stackId="a" fill="#ffbf47" />
        <Bar dataKey="dmarcFailNone" stackId="a" fill="#e53e3e" />
        <Bar dataKey="dmarcFailQuarantine" stackId="a" fill="#e53e3e" />
        <Bar dataKey="dmarcFailReject" stackId="a" fill="#e53e3e" />
      </BarChart>
    </ResponsiveContainer>
  )
}

DmarcTimeGraph.propTypes = {
  data: array.isRequired,
}

export default WithPseudoBox(DmarcTimeGraph)
