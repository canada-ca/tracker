import React from 'react'
import { t, Trans } from '@lingui/macro'
import { SimpleGrid, Text } from '@chakra-ui/core'
import SummaryCard from './SummaryCard'
import { object } from 'prop-types'
import theme from './theme/canada'

const { colors } = theme

export function SummaryGroup({ web, mail }) {
  const webCard = web ? (
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
  ) : (
    <Text fontWeight="bold" textAlign="center">
      <Trans>No web configuration information available for this org.</Trans>
    </Text>
  )

  const mailCard = mail ? (
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
  ) : (
    <Text fontWeight="bold" textAlign="center">
      <Trans>No mail configuration information available for this org.</Trans>
    </Text>
  )
  return (
    <SimpleGrid
      columns={[1, 1, 1, 2]}
      spacing="30px"
      justifyItems="center"
      maxWidth="width.60"
      mx="auto"
      p={['2', '8']}
    >
      {webCard}
      {mailCard}
    </SimpleGrid>
  )
}

SummaryGroup.propTypes = {
  web: object,
  mail: object,
}
