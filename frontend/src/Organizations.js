import React from 'react'
import { number } from 'prop-types'
import { useQuery } from '@apollo/client'
import { Trans } from '@lingui/macro'
import { Layout } from './Layout'
import { ListOf } from './ListOf'
import { Button, Heading, Stack, useToast, Box, Divider } from '@chakra-ui/core'
import {
  PAGINATED_ORGANIZATIONS,
  REVERSE_PAGINATED_ORGANIZATIONS,
} from './graphql/queries'
import { useUserState } from './UserState'
import { Organization } from './Organization'

export default function Organisations({ orgsPerPage = 10 }) {
  const { currentUser } = useUserState()
  const toast = useToast()

  const { loading, error, data, fetchMore } = useQuery(
    PAGINATED_ORGANIZATIONS,
    {
      variables: { first: orgsPerPage },
      context: {
        headers: {
          authorization: currentUser.jwt,
        },
      },
      onError: (error) => {
        const [_, message] = error.message.split(': ')
        toast({
          title: 'Error',
          description: message,
          status: 'failure',
          duration: 9000,
          isClosable: true,
        })
      },
    },
  )

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
      <Stack spacing={10} shouldWrapChildren>
        <Heading as="h1">
          <Trans>Organizations</Trans>
        </Heading>
        <Stack direction="row" spacing={4}>
          <Stack spacing={4} flexWrap="wrap">
            <ListOf
              elements={data.organizations.edges.map((e) => e.node)}
              ifEmpty={() => <Trans>No Organizations</Trans>}
            >
              {({ name, slug, domainCount }, index) => (
                <Box key={`${slug}:${index}`}>
                  <Organization
                    slug={slug}
                    name={name}
                    domainCount={domainCount}
                  />
                  <Divider borderColor="gray.900" />
                </Box>
              )}
            </ListOf>
          </Stack>
        </Stack>
        <Stack isInline align="center">
          <Button
            onClick={() =>
              fetchMore({
                query: REVERSE_PAGINATED_ORGANIZATIONS,
                variables: {
                  before: data.organizations.pageInfo.endCursor,
                  last: orgsPerPage,
                },
              })
            }
            aria-label="Previous page"
          >
            <Trans>Previous</Trans>
          </Button>

          <Button
            onClick={() =>
              fetchMore({
                variables: {
                  first: orgsPerPage,
                  after: data.organizations.pageInfo.endCursor,
                },
              })
            }
            disable={data.organizations.pageInfo.hasNextPage}
            aria-label="Next page"
          >
            <Trans>Next</Trans>
          </Button>
        </Stack>
      </Stack>
    </Layout>
  )
}

Organisations.propTypes = { orgsPerPage: number }
