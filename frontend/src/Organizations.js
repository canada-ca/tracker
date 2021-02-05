import React from 'react'
import { number } from 'prop-types'
import { Trans, t } from '@lingui/macro'
import { Layout } from './Layout'
import { ListOf } from './ListOf'
import {
  Button,
  Heading,
  Stack,
  Box,
  Divider,
  InputGroup,
  InputLeftElement,
  Icon,
  Input,
} from '@chakra-ui/core'
import {
  PAGINATED_ORGANIZATIONS as FORWARD,
  REVERSE_PAGINATED_ORGANIZATIONS as BACKWARD,
} from './graphql/queries'
import { useUserState } from './UserState'
import { OrganizationCard } from './OrganizationCard'
import { usePaginatedCollection } from './usePaginatedCollection'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'
import { LoadingMessage } from './LoadingMessage'

export default function Organisations({ orgsPerPage = 10 }) {
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
    recordsPerPage: orgsPerPage,
    relayRoot: 'findMyOrganizations',
  })

  if (error) return <ErrorFallbackMessage error={error} />

  if (loading)
    return (
      <LoadingMessage>
        <Trans>Organizations</Trans>
      </LoadingMessage>
    )

  return (
    <Layout>
      <Heading as="h1" mb="4" textAlign={['center', 'left']}>
        <Trans>Organizations</Trans>
      </Heading>
      <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
        <InputGroup width="100%" mb="8px">
          <InputLeftElement>
            <Icon name="search" color="gray.300" />
          </InputLeftElement>
          <Input type="text" placeholder={t`Search for an organization`} />
        </InputGroup>
        <ListOf
          elements={nodes}
          ifEmpty={() => <Trans>No Organizations</Trans>}
          mb="4"
        >
          {(
            { name, slug, acronym, domainCount, verified, summaries },
            index,
          ) => (
            <ErrorBoundary
              key={`${slug}:${index}`}
              FallbackComponent={ErrorFallbackMessage}
            >
              <Box>
                <OrganizationCard
                  slug={slug}
                  name={name}
                  acronym={acronym}
                  domainCount={domainCount}
                  verified={verified}
                  summaries={summaries}
                />
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

          <Button
            onClick={next}
            isDisabled={!hasNextPage}
            aria-label="Next page"
          >
            <Trans>Next</Trans>
          </Button>
        </Stack>
      </ErrorBoundary>
    </Layout>
  )
}

Organisations.propTypes = { orgsPerPage: number }
