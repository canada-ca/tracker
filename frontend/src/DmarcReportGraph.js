import React from 'react'

import { Box, Text, Flex } from '@chakra-ui/core'

import PieChart from 'react-minimal-pie-chart'

export function DmarcReportGraph(props) {
  return (
    <Flex flexDirection="column" justifyContent="center" alignItems="center">
      <Box w={'40%'} mt="30px">
        <PieChart
          animate={true}
          animationDuration={500}
          animationEasing="ease-out"
          cx={50}
          cy={50}
          data={[
            {
              title: 'Passed DMARC',
              value: props.passDmarcPercentage,
              color: '#2D8133',
            },
            {
              title: 'Passed ARC',
              value: props.passArcPercentage,
              color: '#2D8133',
            },
            {
              title: 'Failed DMARC',
              value:  props.failDmarcPercentage,
              color: '#e53e3e',
            },
            {
              title: 'Failed DKIM',
              value: props.failDkimPercentage,
              color: '#ffbf47',
            },
            {
              title: 'Failed SPF',
              value: props.failSpfPercentage,
              color: '#ffbf47',
            },
          ]}
          label={false}
          labelPosition={50}
          lengthAngle={360}
          lineWidth={50}
          paddingAngle={3}
          radius={50}
          rounded={false}
          startAngle={0}
          viewBoxSize={[
            100,
            100
          ]}
        />
      </Box>
      <Text fontSize="lg" fontWeight="semibold" mt={5}>
        Result Breakdown
      </Text>

      <Text fontSize="lg">Pass: {props.passDmarcPercentage}%</Text>
      <Text fontSize="lg">
        Fail: {100 - props.passDmarcPercentage}%
      </Text>
    </Flex>
  )
}
