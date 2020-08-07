import React from 'react'
import { number } from 'prop-types'
import { Trans } from '@lingui/macro'
import { Layout } from './Layout'
import { ListOf } from './ListOf'
import { Stack, Button, Heading, Box } from '@chakra-ui/core'
import {
  REVERSE_PAGINATED_DOMAINS as BACKWARD,
  PAGINATED_DOMAINS as FORWARD,
} from './graphql/queries'
import { useUserState } from './UserState'
import { Domain } from './Domain'
import { usePaginatedCollection } from './usePaginatedCollection'

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
      <Heading as="h1">
        <Trans>Domains</Trans>
      </Heading>
      <ListOf elements={nodes} ifEmpty={() => <Trans>No Domains</Trans>}>
        {({ id, url, slug, lastRan }, index) => (
          <Box key={`${slug}:${id}:${index}`}>
            <Domain key={url} url={url} lastRan={lastRan} />
          </Box>
        )}
      </ListOf>
      <Stack isInline align="center">
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
    </Layout>
  )
}

DomainsPage.propTypes = { domainsPerPage: number }
