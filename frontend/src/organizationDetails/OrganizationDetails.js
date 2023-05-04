import React, { useEffect } from 'react'
import { useLazyQuery, useQuery } from '@apollo/client'
import { Trans, t } from '@lingui/macro'
import {
  Box,
  Button,
  Flex,
  Heading,
  IconButton,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useToast,
} from '@chakra-ui/react'
import { ArrowLeftIcon, CheckCircleIcon } from '@chakra-ui/icons'
import { UserIcon } from '../theme/Icons'
import { Link as RouteLink, useParams, useHistory } from 'react-router-dom'
import { ErrorBoundary } from 'react-error-boundary'

import { OrganizationDomains } from './OrganizationDomains'
import { OrganizationAffiliations } from './OrganizationAffiliations'
import { OrganizationSummary } from './OrganizationSummary'

import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { LoadingMessage } from '../components/LoadingMessage'
import { useDocumentTitle } from '../utilities/useDocumentTitle'
import { REQUEST_INVITE_TO_ORG } from '../graphql/mutations'
import { useMutation } from '@apollo/client'
import { GET_ORGANIZATION_DOMAINS_STATUSES_CSV, ORG_DETAILS_PAGE } from '../graphql/queries'
import { RadialBarChart } from '../summaries/RadialBarChart'
import { ExportButton } from '../components/ExportButton'
import { bool } from 'prop-types'

export default function OrganizationDetails({ isLoggedIn }) {
  const { orgSlug, activeTab } = useParams()
  const history = useHistory()
  const tabNames = ['summary', 'dmarc_phases', 'domains', 'users']
  const defaultActiveTab = tabNames[0]
  const toast = useToast()

  useDocumentTitle(`${orgSlug}`)

  const { loading, error, data } = useQuery(ORG_DETAILS_PAGE, {
    variables: { slug: orgSlug },
    // errorPolicy: 'ignore', // allow partial success
  })

  const [getOrgDomainStatuses, { loading: orgDomainStatusesLoading, _error, _data }] = useLazyQuery(
    GET_ORGANIZATION_DOMAINS_STATUSES_CSV,
    {
      variables: { orgSlug: orgSlug },
    },
  )

  const [requestInviteToOrg] = useMutation(REQUEST_INVITE_TO_ORG, {
    onError(error) {
      toast({
        title: error.message,
        description: t`Unable to request invite, please try again.`,
        status: 'error',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    },
    onCompleted({ requestOrgAffiliation }) {
      if (requestOrgAffiliation.result.__typename === 'InviteUserToOrgResult') {
        toast({
          title: t`Invite Requested`,
          description: t`Your request has been sent to the organization administrators.`,
          status: 'success',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      } else {
        toast({
          title: t`Unable to request invite, please try again.`,
          description: requestOrgAffiliation.result.description,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      }
    },
  })

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
      <Flex flexDirection="row" align="center" mb="4" flexWrap={{ base: 'wrap', md: 'nowrap' }}>
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
          <Flex align="center">
            {orgName}
            {data?.organization?.verified && (
              <>
                {' '}
                <CheckCircleIcon ml="1" color="blue.500" boxSize="icons.lg" />
              </>
            )}
          </Flex>
        </Heading>
        {isLoggedIn && (
          <Button
            ml="auto"
            order={{ base: 2, md: 1 }}
            variant="primary"
            onClick={async () =>
              requestInviteToOrg({
                variables: {
                  orgId: data?.organization?.id,
                },
              })
            }
          >
            <Trans>Request Invite</Trans>
            <UserIcon ml="1" color="white" boxSize="icons.md" />
          </Button>
        )}
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
              <OrganizationSummary summaries={data?.organization?.summaries} />
            </ErrorBoundary>
          </TabPanel>
          <TabPanel>
            <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
              <Box>
                <Text fontSize="3xl">DMARC Phases</Text>
                <RadialBarChart height={600} width={600} data={data?.organization?.summaries?.dmarcPhase?.categories} />
              </Box>
            </ErrorBoundary>
          </TabPanel>
          <TabPanel>
            <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
              <ExportButton
                ml="auto"
                my="2"
                mt={{ base: '4', md: 0 }}
                fileName={`${orgName}_${new Date().toLocaleDateString()}_Tracker`}
                dataFunction={async () => {
                  const result = await getOrgDomainStatuses()
                  return result.data?.findOrganizationBySlug?.toCsv
                }}
                isLoading={orgDomainStatusesLoading}
              />
              <OrganizationDomains orgSlug={orgSlug} />
            </ErrorBoundary>
          </TabPanel>
          {!isNaN(data?.organization?.affiliations?.totalCount) && (
            <TabPanel>
              <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
                <OrganizationAffiliations orgSlug={orgSlug} />
              </ErrorBoundary>
            </TabPanel>
          )}
        </TabPanels>
      </Tabs>
    </Box>
  )
}

OrganizationDetails.propTypes = {
  isLoggedIn: bool,
}
