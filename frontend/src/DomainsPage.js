import React from 'react'
import { number } from 'prop-types'
import { Trans } from '@lingui/macro'
import { Layout } from './Layout'
import { ListOf } from './ListOf'
import { Stack, Button, Box, Divider } from '@chakra-ui/core'
import {
  REVERSE_PAGINATED_DOMAINS as BACKWARD,
  PAGINATED_DOMAINS as FORWARD,
} from './graphql/queries'
import { useUserState } from './UserState'
import { DomainCard } from './DomainCard'
import { usePaginatedCollection } from './usePaginatedCollection'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'

export default function DomainsPage({ domainsPerPage = 10 }) {
  const { currentUser } = useUserState()
  const {
    loading,
    error,
    nodes,
    next,
    previous,
    hasNextPage,
    hasPreviousPage,
  } = usePaginatedCollection({
    fetchForward: FORWARD,
    fetchBackward: BACKWARD,
    fetchHeaders: { authorization: currentUser.jwt },
    recordsPerPage: domainsPerPage,
  })

  if (error)
    return (
      <p>
        <Trans>error {error.message}</Trans>
      </p>
    )

  if (loading)
    return (
      <p>
        <Trans>Loading...</Trans>
      </p>
    )

  return (
    <Layout>
      <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
        <ListOf
          elements={nodes}
          ifEmpty={() => <Trans>No Domains</Trans>}
          mb="4"
        >
          {({ id, url, slug, lastRan }, index) => (
            <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
              <Box key={`${slug}:${id}:${index}`}>
                <DomainCard key={url} url={url} lastRan={lastRan} />
                <Divider borderColor="gray.900" />
              </Box>
            </ErrorBoundary>
          )}
        </ListOf>
      </ErrorBoundary>
      <Stack isInline align="center" mb="4">
        <Button
          onClick={previous}
          disable={!!hasPreviousPage}
          aria-label="Previous page"
        >
          <Trans>Previous</Trans>
        </Button>

        <Button onClick={next} disable={!!hasNextPage} aria-label="Next page">
          <Trans>Next</Trans>
        </Button>
      </Stack>
      <Trans>*All data represented is mocked for demonstration purposes</Trans>
    </Layout>
  )
}

DomainsPage.propTypes = { domainsPerPage: number }
