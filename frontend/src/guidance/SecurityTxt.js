import React from 'react'
import { Box, Code, Text } from '@chakra-ui/react'
import { array } from 'prop-types'
import { Trans } from '@lingui/macro'

export function SecurityTxt({ data, ...props }) {
  let validRecords = []
  const getErrorMsg = () => {
    if (!data || data?.length === 0) {
      return (
        <Text>
          <Trans>Data not available for this service. Try rescanning or come back later.</Trans>
        </Text>
      )
    }

    validRecords = data?.filter(({ error }) => !error)
    if (validRecords?.length === 0) {
      return (
        <Text>
          <Trans>No record was found for this service.</Trans>
        </Text>
      )
    }

    return null
  }

  const errorMsg = getErrorMsg()

  return (
    <Box {...props}>
      <Text mt="2" fontWeight="bold">
        Security.txt
      </Text>
      {errorMsg ? (
        errorMsg
      ) : (
        <Code p="2" whiteSpace="pre-wrap">
          {validRecords[0]?.raw}
        </Code>
      )}
    </Box>
  )
}

SecurityTxt.propTypes = {
  data: array,
}
