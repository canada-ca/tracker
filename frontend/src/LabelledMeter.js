import React from 'react'
import { Box, Meter, Stack, Text } from 'grommet'
import { grommet } from 'grommet/themes'

export const LabelledMeter = ({ meterValue }) => {
  return (
    <Box align="center" pad="large">
      <Stack anchor="center">
        <Meter
          type="circle"
          background="dark-6"
          values={[{ value: meterValue, color: "neutral-3" }]}
          size="xsmall"
          thickness="small"
        />
        <Box direction="row" align="center" pad={{ bottom: 'xsmall' }}>
          <Text size="xlarge" weight="bold">
            {meterValue}
          </Text>
          <Text size="small">%</Text>
        </Box>
      </Stack>
    </Box>
  )
}
