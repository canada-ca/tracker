import React from 'react'
import { number } from 'prop-types'
import { Trans } from '@lingui/macro'
import { Layout } from './Layout'
import { ListOf } from './ListOf'
import {
  Stack,
  Button,
  Heading,
  Box,
  Divider,
  IconButton,
} from '@chakra-ui/core'
import {
  REVERSE_PAGINATED_DOMAINS as BACKWARD,
  PAGINATED_DOMAINS as FORWARD,
} from './graphql/queries'
import { useUserState } from './UserState'
import { DomainCard } from './DomainCard'
import { usePaginatedCollection } from './usePaginatedCollection'
import { useHistory } from 'react-router-dom'

export default function DomainsPage({ domainsPerPage = 10 }) {
  const history = useHistory()
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
      <Stack isInline align="center" mb="4">
        <IconButton
          icon="arrow-left"
          onClick={history.goBack}
          color="gray.900"
          fontSize="2xl"
          aria-label="back to organizations"
        />
        <Heading as="h1">
          <Trans>Domains</Trans>
        </Heading>
      </Stack>
      <ListOf elements={nodes} ifEmpty={() => <Trans>No Domains</Trans>} mb="4">
        {({ id, url, slug, lastRan }, index) => (
          <Box key={`${slug}:${id}:${index}`}>
            <DomainCard key={url} url={url} lastRan={lastRan} />
            <Divider borderColor="gray.900" />
          </Box>
        )}
      </ListOf>
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
    </Layout>
  )
}

DomainsPage.propTypes = { domainsPerPage: number }
