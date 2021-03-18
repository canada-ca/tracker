import React from 'react'
import { Trans } from '@lingui/macro'
import { Box, Button, Divider, Stack, Text } from '@chakra-ui/core'
import { PAGINATED_ORG_DOMAINS as FORWARD } from './graphql/queries'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'
import { LoadingMessage } from './LoadingMessage'
import { DomainCard } from './DomainCard'
import { ListOf } from './ListOf'
import { useUserState } from './UserState'
import { usePaginatedCollection } from './usePaginatedCollection'
import { number, string } from 'prop-types'

export function OrganizationDomains({ domainsPerPage = 10, orgSlug }) {
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
    fetchHeaders: { authorization: currentUser.jwt },
    variables: { slug: orgSlug },
    recordsPerPage: domainsPerPage,
    relayRoot: 'findOrganizationBySlug.domains',
  })

  if (error) return <ErrorFallbackMessage error={error} />

  if (loading)
    return (
      <LoadingMessage>
        <Trans>Domains</Trans>
      </LoadingMessage>
    )

  return (
    <Box>
      <ListOf
        elements={nodes}
        ifEmpty={() => (
          <Text fontSize="xl" fontWeight="bold">
            <Trans>No Domains</Trans>
          </Text>
        )}
        mb="4"
      >
        {({ id, domain, lastRan, status }, index) => (
          <ErrorBoundary
            key={`${id}:${index}`}
            FallbackComponent={ErrorFallbackMessage}
          >
            <Box>
              <DomainCard url={domain} lastRan={lastRan} status={status} />
              <Divider borderColor="gray.900" />
            </Box>
          </ErrorBoundary>
        )}
      </ListOf>
      <Stack isInline align="center" mb="4">
        <Button
          onClick={previous}
          isDisabled={!hasPreviousPage}
          aria-label="Previous page"
        >
          <Trans>Previous</Trans>
        </Button>

        <Button onClick={next} isDisabled={!hasNextPage} aria-label="Next page">
          <Trans>Next</Trans>
        </Button>
      </Stack>
    </Box>
  )
}

OrganizationDomains.propTypes = { domainsPerPage: number, orgSlug: string }
