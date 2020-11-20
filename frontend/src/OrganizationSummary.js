import React from 'react'
import { Trans } from '@lingui/macro'
import { Layout } from './Layout'
import { Text, Stack, Box } from '@chakra-ui/core'
import { SummaryGroup } from './SummaryGroup'
import { number, string } from 'prop-types'

export function OrganizationSummary({
  domainCount,
  userCount,
  city,
  province,
}) {
  return (
    <Layout>
      <Box fontSize="xl">
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
            <Trans>Internet facing services</Trans>
          </Text>
        </Stack>

        <Stack isInline align="center">
          <Text fontWeight="semibold">{userCount}</Text>
          <Text>
            <Trans>Total users</Trans>
          </Text>
        </Stack>
      </Box>
      <SummaryGroup />
      <Trans>*All data represented is mocked for demonstration purposes</Trans>
    </Layout>
  )
}

OrganizationSummary.propTypes = {
  domainCount: number,
  userCount: number,
  city: string,
  province: string,
}
