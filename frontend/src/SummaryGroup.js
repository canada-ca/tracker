import React from 'react'
import { Trans, t } from '@lingui/macro'
import { useToast, SimpleGrid } from '@chakra-ui/core'
import SummaryCard from './SummaryCard'
import { string } from 'prop-types'
import theme from './theme/canada'
import { useQuery } from '@apollo/client'
import { WEB_AND_EMAIL_SUMMARIES } from './graphql/queries'

const { colors } = theme

export function SummaryGroup() {
  const toast = useToast()

  const { loading, error, data } = useQuery(WEB_AND_EMAIL_SUMMARIES, {
    onError: ({ message }) => {
      toast({
        title: 'Error',
        description: message,
        status: 'failure',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    },
  })

  if (error) {
    return <p>{String(error)}</p>
  }

  if (loading) {
    return (
      <p>
        <Trans>Loading...</Trans>
      </p>
    )
  }

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
          'full-fail': {
            name: t`Non-compliant TLS`,
            color: colors.weak,
          },
          'partial-pass': {
            name: t`Partially TLS`,
            color: colors.moderate,
          },
          'full-pass': {
            name: t`Policy compliant TLS`,
            color: colors.strong,
          },
        }}
        data={data.webSummary}
      />
      <SummaryCard
        title={t`Email Configuration`}
        description={t`Email security settings summary`}
        categoryDisplay={{
          'full-pass': {
            name: t`Dmarc pass`,
            color: colors.strong,
          },
          'partial-pass': {
            name: t`Dmarc partial`,
            color: colors.moderate,
          },
          'full-fail': {
            name: t`Dmarc fail`,
            color: colors.weak,
          },
        }}
        data={data.emailSummary}
      />
    </SimpleGrid>
  );
}

SummaryGroup.propTypes = {
  title: string,
  description: string,
}
