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
  Icon,
} from '@chakra-ui/core'
import { ORG_DETAILS_PAGE } from './graphql/queries'
import { useUserState } from './UserState'
import { useParams, Link as RouteLink } from 'react-router-dom'
import { OrganizationSummary } from './OrganizationSummary'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'
import { LoadingMessage } from './LoadingMessage'
import { OrganizationDomains } from './OrganizationDomains'
import { OrganizationAffiliations } from './OrganizationAffiliations'
import { useDocumentTitle } from './useDocumentTitle'

export default function OrganizationDetails() {
  const { orgSlug } = useParams()
  const { currentUser } = useUserState()
  const toast = useToast()

  useDocumentTitle(`${orgSlug}`)

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
          as={RouteLink}
          to={'/organizations'}
          color="gray.900"
          fontSize="2xl"
          aria-label="back to organizations"
        />
        <Heading as="h1" textAlign={['center', 'left']}>
          {orgName}
        </Heading>
        {data?.organization?.verified && (
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
          <Tab>
            <Trans>Users</Trans>
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
              <OrganizationSummary
                summaries={data?.organization?.summaries}
                domainCount={data.organization.domainCount}
                userCount={data.organization.affiliations.totalCount}
                city={data.organization.city}
                province={data.organization.province}
              />
            </ErrorBoundary>
          </TabPanel>
          <TabPanel>
            <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
              <OrganizationDomains orgSlug={orgSlug} domainsPerPage={10} />
            </ErrorBoundary>
          </TabPanel>
          <TabPanel>
            <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
              <OrganizationAffiliations orgSlug={orgSlug} usersPerPage={10} />
            </ErrorBoundary>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Layout>
  )
}
