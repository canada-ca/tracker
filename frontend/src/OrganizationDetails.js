import React, { useState } from 'react'
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
  Box,
  Divider,
} from '@chakra-ui/core'
import { ORG_DETAILS_PAGE } from './graphql/queries'
import { useUserState } from './UserState'
import { useParams, useHistory } from 'react-router-dom'
import UserList from './UserList'
import { OrganizationSummary } from './OrganizationSummary'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'
import { LoadingMessage } from './LoadingMessage'
import { DomainCard } from './DomainCard'
import { ListOf } from './ListOf'
import { PaginationButtons } from './PaginationButtons'

export default function OrganizationDetails() {
  const { orgSlug } = useParams()
  const { currentUser, isLoggedIn } = useUserState()
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
        position: 'top-left',
      })
    },
  })

  let orgName = ''
  if (data?.organization) {
    orgName = data.organization.name
  }

  let domains = []
  if (data?.organization?.domains?.edges) {
    domains = data.organization.domains.edges.map((e) => e.node)
  }

  const [currentPage, setCurrentPage] = useState(1)
  const [domainsPerPage] = useState(10)

  // Get current domains
  const indexOfLastDomain = currentPage * domainsPerPage
  const indexOfFirstDomain = indexOfLastDomain - domainsPerPage
  const currentDomains = domains.slice(indexOfFirstDomain, indexOfLastDomain)

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  if (loading) {
    return (
      <LoadingMessage>
        <Trans>Organization Details</Trans>
      </LoadingMessage>
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
          {isLoggedIn() && (
            <Tab>
              <Trans>Users</Trans>
            </Tab>
          )}
        </TabList>

        <TabPanels>
          <TabPanel>
            <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
              <OrganizationSummary />
            </ErrorBoundary>
          </TabPanel>
          <TabPanel>
            <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
              <ListOf
                elements={currentDomains}
                ifEmpty={() => <Trans>No Domains</Trans>}
                mb="4"
              >
                {({ id, url, lastRan }, index) => (
                  <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
                    <Box key={`${id}:${index}`}>
                      <DomainCard url={url} lastRan={lastRan} />
                      <Divider borderColor="gray.900" />
                    </Box>
                  </ErrorBoundary>
                )}
              </ListOf>
              {domains.length > 0 && (
                <PaginationButtons
                  perPage={domainsPerPage}
                  total={domains.length}
                  paginate={paginate}
                  currentPage={currentPage}
                />
              )}
              <Trans>
                *All data represented is mocked for demonstration purposes
              </Trans>
            </ErrorBoundary>
          </TabPanel>
          {isLoggedIn() && (
            <TabPanel>
              <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
                <UserList
                  userListData={data.userList}
                  orgName={orgName}
                  orgSlug={orgSlug}
                />
              </ErrorBoundary>
            </TabPanel>
          )}
        </TabPanels>
      </Tabs>
    </Layout>
  )
}
