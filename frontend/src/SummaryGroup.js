import React from 'react'
import { Trans, t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { SimpleGrid } from '@chakra-ui/core'
import SummaryCard from './SummaryCard'
import { string } from 'prop-types'
import theme from './theme/canada'
import { useQuery } from '@apollo/react-hooks'
import { WEB_AND_EMAIL_SUMMARIES } from './graphql/queries'

const { colors } = theme

export function SummaryGroup() {
  const { i18n } = useLingui()

  const { loading, error, data } = useQuery(WEB_AND_EMAIL_SUMMARIES, {
    onError: (error) => {
      const [_, message] = error.message.split(': ')
      console.log(message)
    },
  })

  if (loading) {
    return (
      <p>
        <Trans>Loading...</Trans>
      </p>
    )
  }

  if (error) {
    return <p>{String(error)}</p>
  }

  return (
    <SimpleGrid
      columns={[1, 1, 1, 2]}
      spacing="30px"
      justifyItems="center"
      maxWidth="60em"
      mx="auto"
      p="2em"
    >
      <SummaryCard
        title={i18n._(t`Web Configuration`)}
        description={i18n._(t`Web encryption settings summary`)}
        categoryDisplay={{
          'full-fail': {
            name: i18n._(t`Non-compliant TLS`),
            color: colors.weak,
          },
          'full-pass': {
            name: i18n._(t`Policy compliant TLS`),
            color: colors.strong,
          },
        }}
        data={data.webSummary}
      />
      <SummaryCard
        title={i18n._(t`Email Configuration`)}
        description={i18n._(t`Email security settings summary`)}
        categoryDisplay={{
          'full-pass': {
            name: i18n._(t`Dmarc pass`),
            color: colors.strong,
          },
          'partial-pass': {
            name: i18n._(t`Dmarc partial`),
            color: colors.moderate,
          },
          'full-fail': {
            name: i18n._(t`Dmarc fail`),
            color: colors.weak,
          },
        }}
        data={data.emailSummary}
      />
    </SimpleGrid>
  )
}

SummaryGroup.propTypes = {
  title: string,
  description: string,
}
