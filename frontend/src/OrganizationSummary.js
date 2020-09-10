import React from 'react'
import { Trans } from '@lingui/macro'
import { Layout } from './Layout'
import { Text, Stack, Box } from '@chakra-ui/core'
import { SummaryGroup } from './SummaryGroup'

export function OrganizationSummary() {
  return (
    <Layout>
      <Box fontSize="xl">
        <Stack isInline align="center">
          <Text fontWeight="semibold">
            <Trans>Internet facing services:</Trans>
          </Text>
          <Text>18</Text>
        </Stack>

        <Stack isInline align="center">
          <Text fontWeight="semibold">
            <Trans>Users joined:</Trans>
          </Text>
          <Text>7</Text>
        </Stack>
      </Box>
      <SummaryGroup name="dashboard" />
      <Trans>*All data represented is mocked for demonstration purposes</Trans>
    </Layout>
  )
}
