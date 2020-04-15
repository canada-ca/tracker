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

import { Text, Stack } from '@chakra-ui/core'

export function DmarcReportTimeGraph() {
  const data = [
    {
      month: 'January',
      'Passed Dmarc': 80,
      'Failed Dmarc': 12,
      'Failed Dkim': 2,
      'Failed Spf': 6,
    },
    {
      month: 'February',
      'Passed Dmarc': 60,
      'Failed Dmarc': 18,
      'Failed Dkim': 9,
      'Failed Spf': 13,
    },
    {
      month: 'March',
      'Passed Dmarc': 40,
      'Failed Dmarc': 38,
      'Failed Dkim': 2,
      'Failed Spf': 20,
    },
    {
      month: 'April',
      'Passed Dmarc': 94,
      'Failed Dmarc': 6,
      'Failed Dkim': 0,
      'Failed Spf': 0,
    },
    {
      month: 'May',
      'Passed Dmarc': 60,
      'Failed Dmarc': 18,
      'Failed Dkim': 9,
      'Failed Spf': 13,
    },
    {
      month: 'June',
      'Passed Dmarc': 70,
      'Failed Dmarc': 8,
      'Failed Dkim': 9,
      'Failed Spf': 13,
    },
  ]
  return (
    <Stack textAlign="center" mt="100px">
      <Text fontSize="2xl" fontWeight="bold">
        Dmarc Results by Month
      </Text>
      <ResponsiveContainer width="90%" height={500}>
        <BarChart
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
          <Bar dataKey="Passed Dmarc" stackId="a" fill="#2D8133" />
          <Bar dataKey="Failed Dmarc" stackId="a" fill="#e53e3e" />
          <Bar dataKey="Failed Dkim" stackId="a" fill="#ffbf47" />
          <Bar dataKey="Failed Spf" stackId="a" fill="#ffbf47" />
        </BarChart>
      </ResponsiveContainer>
    </Stack>
  )
}
