import React from 'react'
import { useQuery } from '@apollo/react-hooks'
import { Trans } from '@lingui/macro'
import { Layout } from './Layout'
import { Heading, Text, Stack, List, ListItem } from '@chakra-ui/core'
import { DOMAINS } from './graphql/queries'
import { useUserState } from './UserState'

export default function DomainsPage() {
  const { currentUser } = useUserState()
  const { loading, error, data } = useQuery(DOMAINS, {
    context: {
      headers: {
        authorization: currentUser.jwt,
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
            <List>
              {data.domains.edges.map((edge, i) => {
                if (edge.node) {
                  return (
                    <ListItem key={edge.node.url + i}>
                      <Text>{edge.node.url}</Text>
                    </ListItem>
                  )
                } else {
                  return (
                    <ListItem key={"edge" + i}>
                      <Trans>No domains scanned yet.</Trans>
                    </ListItem>
                  )
                }
              })}
            </List>
          </Stack>
        </Stack>
      </Stack>
    </Layout>
  )
}
