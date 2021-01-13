import React from 'react'
import { t } from '@lingui/macro'
import { SimpleGrid } from '@chakra-ui/core'
import SummaryCard from './SummaryCard'
import { object } from 'prop-types'
import theme from './theme/canada'

const { colors } = theme

export function SummaryGroup({ web, mail }) {
  return (
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
            name: t`Compliant TLS`,
            color: colors.strong,
          },
        }}
        data={web}
      />
      <SummaryCard
        title={t`Email Configuration`}
        description={t`Email security settings summary`}
        categoryDisplay={{
          pass: {
            name: t`DMARC pass`,
            color: colors.strong,
          },
          fail: {
            name: t`DMARC fail`,
            color: colors.weak,
          },
        }}
        data={mail}
      />
    </SimpleGrid>
  )
}

SummaryGroup.propTypes = {
  web: object,
  mail: object,
}
