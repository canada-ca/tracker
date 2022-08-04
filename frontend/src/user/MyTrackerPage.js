import React, { useEffect } from 'react'
import { useQuery } from '@apollo/client'
import { Trans } from '@lingui/macro'
import {
  Box,
  Flex,
  Heading,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from '@chakra-ui/react'
import { useParams, useHistory } from 'react-router-dom'
import { ErrorBoundary } from 'react-error-boundary'

import { OrganizationDomains } from '../organizationDetails/OrganizationDomains'
import { OrganizationSummary } from '../organizationDetails/OrganizationSummary'

import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { LoadingMessage } from '../components/LoadingMessage'
import { MY_TRACKER_PAGE } from '../graphql/queries'
import { RadialBarChart } from '../summaries/RadialBarChart'

export default function OrganizationDetails() {
  const { activeTab } = useParams()
  const history = useHistory()
  const tabNames = ['summary', 'dmarc_phases', 'domains']
  const defaultActiveTab = tabNames[0]

  const { loading, error, data } = useQuery(MY_TRACKER_PAGE, {
    variables: {
      first: 10,
      orderBy: { field: 'DOMAIN', direction: 'ASC' },
      search: '',
    },
  })

  useEffect(() => {
    if (!activeTab) {
      history.replace(`/my-tracker/${defaultActiveTab}`)
    }
  }, [activeTab, history, defaultActiveTab])

  if (loading) {
    return (
      <LoadingMessage>
        <Trans>myTracker</Trans>
      </LoadingMessage>
    )
  }

  if (error) {
    return <ErrorFallbackMessage error={error} />
  }

  const changeActiveTab = (index) => {
    const tab = tabNames[index]
    if (activeTab !== tab) {
      history.replace(`/my-tracker/${tab}`)
    }
  }

  console.log(activeTab)

  return (
    <Box w="100%">
      <Flex
        flexDirection="row"
        align="center"
        mb="4"
        flexWrap={{ base: 'wrap', md: 'nowrap' }}
      >
        <Heading
          as="h1"
          textAlign={{ base: 'center', md: 'left' }}
          mr={{ base: '0', md: '0.5rem' }}
          order={{ base: 2, md: 1 }}
          flexBasis={{ base: '100%', md: 'auto' }}
        >
          <Trans>My Tracker</Trans>
        </Heading>
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
        </TabList>

        <TabPanels>
          <TabPanel>
            <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
              <OrganizationSummary
                summaries={data?.findMyTracker?.summaries}
                domainCount={data?.findMyTracker?.domainCount}
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
                  data={data?.findMyTracker?.summaries?.dmarcPhase?.categories}
                />
              </Box>
            </ErrorBoundary>
          </TabPanel>
          <TabPanel>
            <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
              <OrganizationDomains />
            </ErrorBoundary>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  )
}
