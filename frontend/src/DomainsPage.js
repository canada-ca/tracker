import React from 'react'
import { useQuery } from '@apollo/react-hooks'
import { Trans } from '@lingui/macro'
import { Layout } from './Layout'
import { Heading, Stack, useToast } from '@chakra-ui/core'
import { DOMAINS } from './graphql/queries'
import { useUserState } from './UserState'
import { Domain } from './Domain'
import { DomainList } from './DomainList'

export default function DomainsPage() {
  const { currentUser } = useUserState()
  const toast = useToast()
  const { loading, _error, data } = useQuery(DOMAINS, {
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
  })

  let domains = []
  if (data && data.domains.edges) {
    domains = data.domains.edges.map((e) => e.node)
  }

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
          <Trans>Domains</Trans>
        </Heading>
        {data && data.domains && (
          <Stack spacing={4}>
            <Stack spacing={4} direction="row" flexWrap="wrap">
              <DomainList domains={domains}>
                {(domain) => (
                  <Domain
                    key={domain.url}
                    url={domain.url}
                    lastRan={domain.lastRan}
                  />
                )}
              </DomainList>
            </Stack>
          </Stack>
        )}
      </Stack>
    </Layout>
  )
}
