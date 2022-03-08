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
      id="httpsStatus"
      title={t`HTTPS Configuration Summary`}
      description={t`HTTPS is configured and HTTP connections redirect to HTTPS (ITPIN 6.1.1)`}
      categoryDisplay={{
        fail: {
          name: t`Non-compliant`,
          color: '#22485B',
        },
        pass: {
          name: t`Compliant`,
          color: '#F15E6B',
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
      title={t`DMARC Configuration Summary`}
      description={t`A minimum DMARC policy of “p=none” with at least one address defined as a recipient of aggregate reports`}
      categoryDisplay={{
        'not implemented': {
          name: t`Not Implemented`,
          color: '#22485B',
        },
        unscanned: {
          name: t`Unscanned`,
          color: colors.gray['400'],
        },
        implemented: {
          name: t`Implemented`,
          color: '#F15E6B',
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
