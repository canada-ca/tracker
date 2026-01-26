import React from 'react'
import { Box, Code, Text } from '@chakra-ui/react'
import { array } from 'prop-types'
import { Trans } from '@lingui/macro'

export function SecurityTxt({ data, ...props }) {
  let errorMsg
  if (typeof data === 'undefined' || data.length === 0) {
    errorMsg = (
      <Text>
        <Trans>Data not available for this service. Try rescanning or come back later.</Trans>
      </Text>
    )
  }

  const validRecords = data.filter(({ error }) => typeof error === 'undefined')
  if (validRecords.length === 0) {
    errorMsg = (
      <Text>
        <Trans>No record was found for this service.</Trans>
      </Text>
    )
  }

  return (
    <Box {...props}>
      <Text mt="2" fontWeight="bold">
        Security.txt
      </Text>
      {errorMsg ?? <Code>{data.raw}</Code>}
    </Box>
  )
}

SecurityTxt.propTypes = {
  data: array,
}
