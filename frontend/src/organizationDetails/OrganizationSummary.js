import React from 'react'
import { Box } from '@chakra-ui/react'
import { SummaryGroup } from '../summaries/SummaryGroup'
import { number, object, string } from 'prop-types'

export function OrganizationSummary({ summaries }) {
  return (
    <Box w="100%">
      <SummaryGroup
        https={summaries?.https}
        dmarcPhases={summaries?.dmarcPhase}
      />
    </Box>
  )
}

OrganizationSummary.propTypes = {
  summaries: object,
  domainCount: number,
  userCount: number,
  city: string,
  province: string,
}
