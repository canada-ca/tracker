import React from 'react'
import { Trans } from '@lingui/macro'
import { Box, Stack, Text } from '@chakra-ui/react'
import { SummaryGroup } from '../summaries/SummaryGroup'
import { number, object, string } from 'prop-types'

export function OrganizationSummary({
  summaries,
  domainCount,
  userCount,
  city,
  province,
}) {
  return (
    <Box w="100%" px={4}>
      <Stack fontSize="xl" align={{ base: 'center', md: 'flex-start' }}>
        <Stack isInline align="center">
          <Text>
            <Trans>Based in:</Trans>
          </Text>
          <Text fontWeight="semibold">
            {city}, {province}
          </Text>
        </Stack>

        <Stack isInline align="center">
          <Text fontWeight="semibold">{domainCount}</Text>
          <Text>
            <Trans>Internet facing domains</Trans>
          </Text>
        </Stack>

        {!isNaN(userCount) && (
          <Stack isInline align="center">
            <Text fontWeight="semibold">{userCount}</Text>
            <Text>
              <Trans>Total users</Trans>
            </Text>
          </Stack>
        )}
      </Stack>
      <SummaryGroup web={summaries?.web} dmarcPhases={summaries?.dmarcPhase} />
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
