import React from 'react'
import { useQuery } from '@apollo/react-hooks'
import { Trans } from '@lingui/macro'
import { Layout } from './Layout'
import { ListOf } from './ListOf'
import { Heading, Stack, useToast, Box, Divider, Text } from '@chakra-ui/core'
import { ORGANIZATIONS } from './graphql/queries'
import { useUserState } from './UserState'
import { Organization } from './Organization'
import SummaryTable from './SummaryTable'
import makeSummaryTableData from './makeSummaryTableData'

export default function Organisations() {
  const { currentUser } = useUserState()
  const toast = useToast()
  // XXX: This component needs pagination
  // This query is currently requesting the first 10 orgs
  const { loading, _error, data } = useQuery(ORGANIZATIONS, {
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

  let organizations = []
  if (data && data.organizations.edges) {
    organizations = data.organizations.edges.map((e) => e.node)
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
          <Trans>Organizations</Trans>
        </Heading>
        <Stack direction="row" spacing={4}>
          <Stack spacing={4} flexWrap="wrap">
            <ListOf
              elements={organizations}
              ifEmpty={() => <Trans>No Organizations</Trans>}
            >
              {({ name, slug, domainCount }, index) => (
                <Box>
                  <Organization
                    key={'org' + index}
                    slug={slug}
                    name={name}
                    domainCount={domainCount}
                    size="2xl"
                  />
                  {domainCount > 0 && (
                    <SummaryTable data={makeSummaryTableData(domainCount)} />
                  )}
                  <Divider borderColor="gray.900" />
                </Box>
              )}
            </ListOf>
          </Stack>
        </Stack>
      </Stack>
      <Text>*all table data is mocked for demonstration purposes</Text>
    </Layout>
  )
}
