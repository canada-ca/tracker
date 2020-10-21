import React from 'react'
import { useQuery } from '@apollo/client'
import { Trans } from '@lingui/macro'
import { Layout } from './Layout'
import {
  IconButton,
  Heading,
  Stack,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/core'
import { ORG_DETAILS_PAGE } from './graphql/queries'
import { useUserState } from './UserState'
import { useParams, useHistory } from 'react-router-dom'
import DomainsPage from './DomainsPage'
import UserList from './UserList'
import { OrganizationSummary } from './OrganizationSummary'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'

export default function OrganizationDetails() {
  const { orgSlug } = useParams()
  const { currentUser } = useUserState()
  const toast = useToast()
  const history = useHistory()
  const { loading, _error, data } = useQuery(ORG_DETAILS_PAGE, {
    variables: { slug: orgSlug },
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
        position: 'bottom-left',
      })
    },
  })

  let orgName = ''
  if (data?.organization) {
    orgName = data.organization.name
  }

  if (loading) {
    return (
      <p>
        <Trans>Loading...</Trans>
      </p>
    )
  }

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
        <Heading as="h1" textAlign={['center', 'left']}>
          <Trans>{orgName}</Trans>
        </Heading>
      </Stack>
      <Tabs isFitted>
        <TabList mb="4">
          <Tab>
            <Trans>Summary</Trans>
          </Tab>
          <Tab>
            <Trans>Domains</Trans>
          </Tab>
          <Tab>
            <Trans>Users</Trans>
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <ErrorBoundary
              FallbackComponent={ErrorFallbackMessage}
              name="summaryGroup"
            >
              <OrganizationSummary />
            </ErrorBoundary>
          </TabPanel>
          <TabPanel>
            <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
              <DomainsPage />
            </ErrorBoundary>
          </TabPanel>
          <TabPanel>
            <ErrorBoundary
              FallbackComponent={ErrorFallbackMessage}
              name="userList"
            >
              <UserList
                userListData={data.userList}
                orgName={orgName}
                orgSlug={orgSlug}
              />
            </ErrorBoundary>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Layout>
  )
}
