import React from 'react'
import { t, Trans } from '@lingui/macro'
import { Flex, Text } from '@chakra-ui/react'
import { object } from 'prop-types'

import { SummaryCard } from './SummaryCard'

import theme from '../theme/canada'

export function SummaryGroup({ web, dmarcPhases }) {
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
      <Trans>
        No web configuration information available for this organization.
      </Trans>
    </Text>
  )

  const dmarcPhaseCard = dmarcPhases ? (
    <SummaryCard
      id="dmarcPhases"
      title={t`DMARC Phases`}
      description={t`DMARC phase summary`}
      categoryDisplay={{
        assess: {
          name: t`1. Assess`,
          color: colors.weak,
        },
        deploy: {
          name: t`2. Deploy`,
          color: colors.moderateAlt,
        },
        enforce: {
          name: t`3. Enforce`,
          color: colors.moderate,
        },
        maintain: {
          name: t`4. Maintain`,
          color: colors.strong,
        },
        unscanned: {
          name: t`Unscanned`,
          color: colors.gray['400'],
        },
      }}
      data={dmarcPhases}
      mb={{ base: 6, md: 0 }}
    />
  ) : (
    <Text fontWeight="bold" textAlign="center">
      <Trans>No DMARC phase information available for this organization.</Trans>
    </Text>
  )

  return (
    <Flex flexWrap="wrap" justifyContent="space-evenly">
      {webCard}
      {dmarcPhaseCard}
    </Flex>
  )
}

SummaryGroup.propTypes = {
  web: object,
  dmarcPhases: object,
}
