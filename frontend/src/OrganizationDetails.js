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
  Text,
  Icon,
} from '@chakra-ui/core'
import { ORG_DETAILS_PAGE } from './graphql/queries'
import { useUserState } from './UserState'
import { useParams, useHistory } from 'react-router-dom'
import { OrganizationSummary } from './OrganizationSummary'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'
import { LoadingMessage } from './LoadingMessage'
import { DomainCard } from './DomainCard'
import { ListOf } from './ListOf'
import { PaginationButtons } from './PaginationButtons'
import { UserCard } from './UserCard'

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
        status: 'error',
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

  let users = []
  if (data?.organization?.affiliations?.edges) {
    users = data.organization.affiliations.edges.map((e) => e.node)
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
        {data.organization.verified && (
          <Icon name="check-circle" color="blue.500" size="icons.lg" />
        )}
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
              <OrganizationSummary
                summaries={data.organization.summaries}
                domainCount={data.organization.domainCount}
                userCount={data.organization.affiliations.totalCount}
                city={data.organization.city}
                province={data.organization.province}
              />
            </ErrorBoundary>
          </TabPanel>
          <TabPanel>
            <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
              <ListOf
                elements={currentDomains}
                ifEmpty={() => (
                  <Text fontSize="xl" fontWeight="bold">
                    <Trans>No Domains</Trans>
                  </Text>
                )}
                mb="4"
              >
                {({ id, domain, lastRan, status }, index) => (
                  <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
                    <Box key={`${id}:${index}`}>
                      <DomainCard
                        url={domain}
                        lastRan={lastRan}
                        status={status}
                      />
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
              <ListOf
                elements={users}
                ifEmpty={() => (
                  <Text fontSize="xl" fontWeight="bold">
                    <Trans>No Users</Trans>
                  </Text>
                )}
                mb="4"
              >
                {({ permission, user }, index) => (
                  <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
                    <Box key={`${user.id}:${index}`}>
                      <UserCard
                        userName={user.userName}
                        role={permission}
                        displayName={user.displayName}
                        tfa={user.tfaValidated}
                      />
                      <Divider borderColor="gray.900" />
                    </Box>
                  </ErrorBoundary>
                )}
              </ListOf>
            </TabPanel>
          )}
        </TabPanels>
      </Tabs>
    </Layout>
  )
}
