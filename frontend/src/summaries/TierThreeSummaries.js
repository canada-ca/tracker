import React from 'react'
import { Box, Flex } from '@chakra-ui/react'
import { SummaryCard } from './SummaryCard'

import theme from '../theme/canada'
import { t } from '@lingui/macro'
import { object } from 'prop-types'

export function TierThreeSummaries({ web, mail }) {
  const { colors } = theme

  return (
    <Box w="100%">
      <Flex direction={{ base: 'column', md: 'row' }} justify="space-evenly" align="stretch" w="100%" mb={6}>
        <SummaryCard
          id="webSummary"
          title={t`Web Summary`}
          description={t`Service configuration is fully compliant with the Web Security Policy in Appendix G`}
          categoryDisplay={{
            fail: {
              name: t`Non-compliant`,
              color: colors.summaries.fail,
            },
            pass: {
              name: t`Compliant`,
              color: colors.summaries.pass,
            },
          }}
          data={web}
          mb={{ base: 6, md: 0 }}
        />

        <SummaryCard
          id="mailSummary"
          title={t`Mail Summary`}
          description={t`Service configuration is fully compliant with the Mail Security Policy in Appendix G`}
          categoryDisplay={{
            fail: {
              name: t`Non-compliant`,
              color: colors.summaries.fail,
            },
            pass: {
              name: t`Compliant`,
              color: colors.summaries.pass,
            },
          }}
          data={mail}
          mb={{ base: 6, md: 0 }}
        />
      </Flex>
    </Box>
  )
}

TierThreeSummaries.propTypes = {
  web: object,
  mail: object,
}
