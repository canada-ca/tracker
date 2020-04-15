import React from 'react'

import { Flex } from '@chakra-ui/core'

import { PieChart, Pie, Tooltip, Cell, ResponsiveContainer } from 'recharts'

export function DmarcReportGraph(props) {
  const data = [
    { name: 'Passed Dmarc', value: props.passDmarcPercentage },
    { name: 'Failed Dmarc', value: props.failDmarcPercentage },
    { name: 'Failed Dkim', value: props.failDkimPercentage },
    { name: 'Failed Spf', value: props.failSpfPercentage },
  ]
  return (
    <Flex flexDirection="column" justifyContent="center">
      <ResponsiveContainer width="100%" height={500}>
        <PieChart alignItems="center">
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="40%"
            outerRadius="80%"
            paddingAngle={2}
            dataKey="value"
          >
            <Cell dataKey="Passed Dmarc" fill="#2D8133" />
            <Cell dataKey="Failed Dmarc" fill="#e53e3e" />
            <Cell dataKey="Failed Dkim" fill="#ffbf47" />
            <Cell dataKey="Failed Spf" fill="#ffbf47" />
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </Flex>
  )
}
