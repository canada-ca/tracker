import React from 'react'
import { useQuery } from '@apollo/react-hooks'
import { Trans } from '@lingui/macro'
import { Layout } from './Layout'
import { Heading, Text, Stack, List, ListItem } from '@chakra-ui/core'
import { DOMAINS } from './graphql/queries'
import { useUserState } from './UserState'

export function DomainsPage() {
  const { currentUser } = useUserState()
  const { loading, error, data } = useQuery(DOMAINS, {
    context: {
      headers: {
        authorization: `Bearer ${currentUser.jwt}`
      },
    },
  })

  if (loading) return <p>Loading...</p>
  if (error) return <p>Error :(</p>

  return (
    <Layout>
      <Stack spacing={10} shouldWrapChildren>
        <Heading as="h1">
          <Trans>Domains</Trans>
        </Heading>
        <Stack spacing={4}>
          <Stack spacing={4} direction="row" flexWrap="wrap">
            <Text>
              <Trans>This is the full list of domains</Trans>
            </Text>
            <List>
              {data.domains.edges.map((edge, i) => {
                return (
                  <ListItem key={edge.node.url + i}>
                    <Text>{edge.node.url}</Text>
                  </ListItem>
                )
              })}
            </List>
          </Stack>
        </Stack>
      </Stack>
    </Layout>
  )
}
