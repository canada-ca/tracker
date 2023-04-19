import React from 'react'
import { Box } from '@chakra-ui/react'
import { SummaryGroup } from '../summaries/SummaryGroup'
import { object } from 'prop-types'

export function OrganizationSummary({ summaries }) {
  const { https, dmarc } = summaries

  return (
    <Box w="100%">
      <SummaryGroup summaries={{ https, dmarc }} />
    </Box>
  )
}

OrganizationSummary.propTypes = {
  summaries: object,
}
