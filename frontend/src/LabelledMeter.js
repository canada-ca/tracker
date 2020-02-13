import React from 'react'
import PropTypes from 'prop-types'
import { Box, Meter, Stack, Text } from 'grommet'

export const LabelledMeter = ({ meterValue }) => {
  return (
    <Box align="center" pad="large">
      <Stack anchor="center">
        <Meter
          type="circle"
          background="dark-6"
          values={[{ value: meterValue, color: 'neutral-3' }]}
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

LabelledMeter.propTypes = {
  meterValue: PropTypes.number,
}
