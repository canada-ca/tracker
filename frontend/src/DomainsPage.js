import React from 'react'
import { useQuery } from '@apollo/react-hooks'
import gql from 'graphql-tag'
import { Trans } from '@lingui/macro'
import { Layout } from './Layout'
import { Heading, Text, Stack, List, ListItem } from '@chakra-ui/core'

export function DomainsPage() {
  const { loading, error, data } = useQuery(gql`
    {
      getDomainByOrganization(org: BOC) {
        domain
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
              {data.getDomainByOrganization.map(domain => {
                return (
                  <ListItem key={domain.domain}>
                    <Text>{domain.domain}</Text>
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
