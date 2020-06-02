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
    <ResponsiveContainer width={500} height={500}>
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
        <Bar dataKey="spf_pass_dkim_pass" stackId="a" fill="#2D8133" />
        <Bar dataKey="spf_fail_dkim_pass" stackId="a" fill="#ffbf47" />
        <Bar dataKey="spf_pass_dkim_fail" stackId="a" fill="#ffbf47" />
        <Bar dataKey="dmarc_fail_reject" stackId="a" fill="#e53e3e" />
        <Bar dataKey="dmarc_fail_none" stackId="a" fill="#e53e3e" />
        <Bar dataKey="dmarc_fail_quarantine" stackId="a" fill="#e53e3e" />
      </BarChart>
    </ResponsiveContainer>
  )
}

DmarcTimeGraph.propTypes = {
  data: array.isRequired,
}

export default WithPseudoBox(DmarcTimeGraph)
