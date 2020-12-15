import React from 'react'
import { Trans, t } from '@lingui/macro'
import { Layout } from './Layout'
import { Text, Stack, Box, SimpleGrid } from '@chakra-ui/core'
// import { SummaryGroup } from './SummaryGroup'
import { number, object, string } from 'prop-types'
import SummaryCard from './SummaryCard'
import theme from './theme/canada'

export function OrganizationSummary({
  summaries,
  domainCount,
  userCount,
  city,
  province,
}) {
  const { colors } = theme
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
      <SimpleGrid
        columns={[1, 1, 1, 2]}
        spacing="30px"
        justifyItems="center"
        maxWidth="width.60"
        mx="auto"
        p={['2', '8']}
      >
        <SummaryCard
          title={t`Web Configuration`}
          description={t`Web encryption settings summary`}
          categoryDisplay={{
            fail: {
              name: t`Non-compliant TLS`,
              color: colors.weak,
            },
            pass: {
              name: t`Policy compliant TLS`,
              color: colors.strong,
            },
          }}
          data={summaries.web}
        />
        <SummaryCard
          title={t`Email Configuration`}
          description={t`Email security settings summary`}
          categoryDisplay={{
            pass: {
              name: t`Dmarc pass`,
              color: colors.strong,
            },
            fail: {
              name: t`Dmarc fail`,
              color: colors.weak,
            },
          }}
          data={summaries.mail}
        />
      </SimpleGrid>
      <Trans>*All data represented is mocked for demonstration purposes</Trans>
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
