import React from 'react'
import { t, Trans } from '@lingui/macro'
import { Flex, Text } from '@chakra-ui/react'
import { object } from 'prop-types'

import { SummaryCard } from './SummaryCard'

import theme from '../theme/canada'

export function SummaryGroup({ https, dmarcPhases }) {
  const { colors } = theme

  const httpsCard = https ? (
    <SummaryCard
      title={t`HTTPS Configuration Summary`}
      description={t`HTTPS is configured and HTTP connections redirect to HTTPS (ITPIN 6.1.1)`}
      categoryDisplay={{
        fail: {
          name: t`Non-compliant HTTPS`,
          color: colors.weak,
        },
        pass: {
          name: t`Compliant HTTPS`,
          color: colors.strong,
        },
        unscanned: {
          name: t`Unscanned`,
          color: colors.gray['400'],
        },
      }}
      data={https}
      mb={{ base: 6, md: 0 }}
    />
  ) : (
    <Text fontWeight="bold" textAlign="center">
      <Trans>
        No HTTPS configuration information available for this organization.
      </Trans>
    </Text>
  )

  const dmarcPhaseCard = dmarcPhases ? (
    <SummaryCard
      id="dmarcPhases"
      title={t`DMARC Phases`}
      description={t`DMARC phase summary`}
      categoryDisplay={{
        'not implemented': { name: t`0. Not Implemented`, color: colors.weak },
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
      {httpsCard}
      {dmarcPhaseCard}
    </Flex>
  )
}

SummaryGroup.propTypes = {
  https: object,
  dmarcPhases: object,
}
