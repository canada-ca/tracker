import React from 'react'
import { t, Trans } from '@lingui/macro'
import { Flex, Text } from '@chakra-ui/react'
import { object } from 'prop-types'

import { SummaryCard } from './SummaryCard'

import theme from '../theme/canada'

export function SummaryGroup({ web, mail }) {
  const { colors } = theme

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
        unscanned: {
          name: t`Unscanned`,
          color: colors.gray['400'],
        },
      }}
      data={web}
      mb={{ base: 6, md: 0 }}
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
        unscanned: {
          name: t`Unscanned`,
          color: colors.gray['400'],
        },
      }}
      data={mail}
      mb={{ base: 6, md: 0 }}
    />
  ) : (
    <Text fontWeight="bold" textAlign="center">
      <Trans>No mail configuration information available for this org.</Trans>
    </Text>
  )
  return (
    <Flex flexWrap="wrap" justifyContent="space-evenly">
      {webCard}
      {mailCard}
    </Flex>
  )
}

SummaryGroup.propTypes = {
  web: object,
  mail: object,
}
