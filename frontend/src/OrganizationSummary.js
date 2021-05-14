import React from 'react'
import { Trans } from '@lingui/macro'
import { Layout } from './Layout'
import { Text, Stack } from '@chakra-ui/core'
import { SummaryGroup } from './SummaryGroup'
import { number, object, string } from 'prop-types'

export function OrganizationSummary({
  summaries,
  domainCount,
  userCount,
  city,
  province,
}) {
  return (
    <Layout>
      <Stack fontSize="xl" align={['center', 'flex-start']}>
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
      </Stack>
      <SummaryGroup web={summaries.web} mail={summaries.mail} />
    </Layout>
  )
}

OrganizationSummary.propTypes = {
  summaries: object,
  domainCount: number,
  userCount: number,
  city: string,
  province: string,
}
