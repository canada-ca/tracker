import React, { useEffect } from 'react'
import {useLazyQuery, useQuery} from '@apollo/client'
import { Trans } from '@lingui/macro'
import {
  Box,
  Flex,
  Heading,
  IconButton,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from '@chakra-ui/react'
import { ArrowLeftIcon, CheckCircleIcon } from '@chakra-ui/icons'
import { Link as RouteLink, useParams, useHistory } from 'react-router-dom'
import { ErrorBoundary } from 'react-error-boundary'

import { OrganizationDomains } from './OrganizationDomains'
import { OrganizationAffiliations } from './OrganizationAffiliations'
import { OrganizationSummary } from './OrganizationSummary'

import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { LoadingMessage } from '../components/LoadingMessage'
import { useDocumentTitle } from '../utilities/useDocumentTitle'
import {
  GET_ORGANIZATION_DOMAINS_STATUSES_CSV,
  ORG_DETAILS_PAGE
} from '../graphql/queries'
import { RadialBarChart } from '../summaries/RadialBarChart'
import {ExportButton} from "../components/ExportButton";

export default function OrganizationDetails() {
  const { orgSlug, activeTab } = useParams()
  const history = useHistory()
  const tabNames = ['summary', 'dmarc_phases', 'domains', 'users']
  const defaultActiveTab = tabNames[0]

  useDocumentTitle(`${orgSlug}`)

  const { loading, error, data } = useQuery(ORG_DETAILS_PAGE, {
    variables: { slug: orgSlug },
    // errorPolicy: 'ignore', // allow partial success
  })

  const [getOrgDomainStatuses, { loading: orgDomainStatusesLoading, _error, _data }] = useLazyQuery(
    GET_ORGANIZATION_DOMAINS_STATUSES_CSV, {variables: {orgSlug: orgSlug}}
  )

  useEffect(() => {
    if (!activeTab) {
      history.replace(`/organizations/${orgSlug}/${defaultActiveTab}`)
    }
  }, [activeTab, history, orgSlug, defaultActiveTab])

  if (loading) {
    return (
      <LoadingMessage>
        <Trans>Organization Details</Trans>
      </LoadingMessage>
    )
  }

  if (error) {
    return <ErrorFallbackMessage error={error} />
  }

  const orgName = data?.organization?.name ?? ''
  const changeActiveTab = (index) => {
    const tab = tabNames[index]
    if (activeTab !== tab) {
      history.replace(`/organizations/${orgSlug}/${tab}`)
    }
  }

  return (
    <Box w="100%">
      <Flex
        flexDirection="row"
        align="center"
        mb="4"
        flexWrap={{ base: 'wrap', md: 'nowrap' }}
      >
        <IconButton
          icon={<ArrowLeftIcon />}
          as={RouteLink}
          to={'/organizations'}
          color="gray.900"
          fontSize="2xl"
          aria-label="back to organizations"
          mr="0.5rem"
          order={0}
        />
        <Heading
          as="h1"
          textAlign={{ base: 'center', md: 'left' }}
          mr={{ base: '0', md: '0.5rem' }}
          order={{ base: 2, md: 1 }}
          flexBasis={{ base: '100%', md: 'auto' }}
        >
          {orgName}
          {data?.organization?.verified && (
            <>
              {' '}
              <CheckCircleIcon color="blue.500" boxSize="icons.lg" />
            </>
          )}
        </Heading>
        <ExportButton
          order={{ base: 2, md: 1 }}
          ml="auto"
          mt={{base: "4", md: 0}}
          fileName={`${orgName}_${new Date().toLocaleDateString()}_Tracker`}
          dataFunction={
          async () => {
            const stuff = await getOrgDomainStatuses()
            return stuff.data?.findOrganizationBySlug?.toCsv
            }
          }
          isLoading={orgDomainStatusesLoading}
        />
      </Flex>
      <Tabs
        isFitted
        variant="enclosed-colored"
        defaultIndex={activeTab ? tabNames.indexOf(activeTab) : tabNames[0]}
        onChange={(i) => changeActiveTab(i)}
      >
        <TabList mb="4">
          <Tab borderTopWidth="4px">
            <Trans>Summary</Trans>
          </Tab>
          <Tab borderTopWidth="4px">
            <Trans>DMARC Phases</Trans>
          </Tab>
          <Tab borderTopWidth="4px">
            <Trans>Domains</Trans>
          </Tab>
          {!isNaN(data?.organization?.affiliations?.totalCount) && (
            <Tab>
              <Trans>Users</Trans>
            </Tab>
          )}
        </TabList>

        <TabPanels>
          <TabPanel>
            <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
              <OrganizationSummary
                summaries={data?.organization?.summaries}
                domainCount={data?.organization?.domainCount}
                userCount={data?.organization?.affiliations?.totalCount}
                city={data?.organization?.city}
                province={data?.organization?.province}
              />
            </ErrorBoundary>
          </TabPanel>
          <TabPanel>
            <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
              <Box>
                <Text fontSize="3xl">DMARC Phases</Text>
                <RadialBarChart
                  height={600}
                  width={600}
                  data={data?.organization?.summaries?.dmarcPhase?.categories}
                />
              </Box>
            </ErrorBoundary>
          </TabPanel>
          <TabPanel>
            <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
              <OrganizationDomains orgSlug={orgSlug} domainsPerPage={10} />
            </ErrorBoundary>
          </TabPanel>
          {!isNaN(data?.organization?.affiliations?.totalCount) && (
            <TabPanel>
              <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
                <OrganizationAffiliations orgSlug={orgSlug} usersPerPage={10} />
              </ErrorBoundary>
            </TabPanel>
          )}
        </TabPanels>
      </Tabs>
    </Box>
  )
}
