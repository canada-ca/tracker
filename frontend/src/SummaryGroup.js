import React from 'react'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Stack, SimpleGrid, Box } from '@chakra-ui/core'
import SummaryCard from './SummaryCard'
import { string } from 'prop-types'
import theme from './theme/canada'

const { colors } = theme

export function SummaryGroup() {
  const { i18n } = useLingui()

  const { data } = {
    data: {
      webSummary: {
        categories: [
          {
            name: 'moderate',
            count: 33,
            percentage: 33,
          },
          {
            name: 'strong',
            count: 33,
            percentage: 33,
          },
          {
            name: 'weak',
            count: 33,
            percentage: 33,
          },
        ],
        total: 100,
      },
    },
  }

  return (
    <Box>
      <Stack textAlign="center" align="center">
        <SimpleGrid columns={[1, 1, 1, 1, 2]} spacing="30px">
          <SummaryCard
            title={i18n._(t`Web Configuration`)}
            description={i18n._(t`Web encryption settings summary`)}
            categoryDisplay={{
              strong: {
                name: i18n._(t`Compliant TLS`),
                color: colors.strong,
              },
              moderate: {
                name: i18n._(t`TLS`),
                color: colors.moderate,
              },
              weak: {
                name: i18n._(t`No TLS`),
                color: colors.weak,
              },
            }}
            data={data.webSummary}
          />
          <SummaryCard
            title={i18n._(t`Email Configuration`)}
            description={i18n._(t`Email security settings summary`)}
            categoryDisplay={{
              strong: {
                name: i18n._(t`Dmarc pass`),
                color: colors.strong,
              },
              moderate: {
                name: i18n._(t`Dmarc partial`),
                color: colors.moderate,
              },
              weak: {
                name: i18n._(t`Dmarc fail`),
                color: colors.weak,
              },
            }}
            data={data.webSummary}
          />
        </SimpleGrid>
        )
      </Stack>
    </Box>
  )
}

SummaryGroup.propTypes = {
  title: string,
  description: string,
}
