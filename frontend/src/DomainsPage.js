import React from 'react'
import { useQuery } from '@apollo/react-hooks'
import gql from 'graphql-tag'
import { Trans } from '@lingui/macro'
import { Layout } from './Layout'
import { Heading, Text, Stack, List, ListItem } from '@chakra-ui/core'

export function DomainsPage() {
  const { loading, error, data } = useQuery(gql`
    {
      domains(organization: BOC) {
        url
      }
    }
  `)

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
              {data.domains.map((domain, i) => {
                return (
                  <ListItem key={domain.url + i}>
                    <Text>{domain.url}</Text>
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
