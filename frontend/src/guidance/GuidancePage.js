import React, { useEffect, useState } from 'react'
import { ArrowLeftIcon, StarIcon } from '@chakra-ui/icons'

import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  IconButton,
  Link,
  ListItem,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useDisclosure,
  useToast,
} from '@chakra-ui/react'

import { ScanDomainButton } from '../domains/ScanDomainButton'
import { Link as RouteLink, useNavigate, useLocation, useParams } from 'react-router-dom'
import { WebGuidance } from './WebGuidance'
import { EmailGuidance } from './EmailGuidance'
import { t, Trans } from '@lingui/macro'
import { useMutation, useQuery } from '@apollo/client'
import { DOMAIN_GUIDANCE_PAGE } from '../graphql/queries'
import { FAVOURITE_DOMAIN } from '../graphql/mutations'
import { LoadingMessage } from '../components/LoadingMessage'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { useUserVar } from '../utilities/userState'
import { AdditionalFindings } from './AdditionalFindings'

import { ListOf } from '../components/ListOf'
import { RequestOrgInviteModal } from '../organizations/RequestOrgInviteModal'
import { OrganizationCard } from '../organizations/OrganizationCard'
import { ErrorBoundary } from 'react-error-boundary'
import { UserIcon } from '../theme/Icons'
import { useDocumentTitle } from '../utilities/useDocumentTitle'

function GuidancePage() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { domainSlug: domain, activeTab } = useParams()
  const toast = useToast()
  const tabNames = ['web-guidance', 'email-guidance', 'additional-findings']
  const defaultActiveTab = tabNames[0]

  const { loading, error, data } = useQuery(DOMAIN_GUIDANCE_PAGE, {
    variables: { domain: domain },
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  })

  const navigate = useNavigate()
  const location = useLocation()
  const { isLoggedIn, isEmailValidated } = useUserVar()
  const { from, searchParams } = location.state || { from: { pathname: '/domains', searchParams: '' } }
  const [orgInfo, setOrgInfo] = useState({})

  const {
    id: domainId,
    domain: domainName,
    web: webScan,
    hasDMARCReport,
    dnsScan,
    mxRecordDiff,
    organizations,
    dmarcPhase,
    rcode,
    status,
    userHasPermission,
    webScanPending,
    wildcardSibling,
    wildcardEntry,
  } = data?.findDomainByDomain || {}

  useDocumentTitle(`${domainName}`)

  const changeActiveTab = (index) => {
    const tab = tabNames[index]
    if (activeTab !== tab) {
      navigate(`/domains/${domain}/${tab}`, { replace: true, state: location.state })
    }
  }

  useEffect(() => {
    if (!activeTab) {
      navigate(`/domains/${domain}/${defaultActiveTab}`, { replace: true, state: location.state })
    }
  }, [activeTab, navigate, domainName, defaultActiveTab])

  const [favouriteDomain, { _loading, _error }] = useMutation(FAVOURITE_DOMAIN, {
    onError: ({ message }) => {
      toast({
        title: t`An error occurred while favouriting a domain.`,
        description: message,
        status: 'error',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    },
    onCompleted() {
      toast({
        title: t`Favourited Domain`,
        description: t`You have successfully added ${domainName} to myTracker.`,
        status: 'success',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    },
  })

  if (loading) {
    return (
      <LoadingMessage>
        <Trans>Guidance results</Trans>
      </LoadingMessage>
    )
  }

  const orgNodes = organizations.edges.map(({ node }) => node)

  let orgList
  if (!userHasPermission) {
    orgList = (
      <ListOf
        elements={orgNodes}
        ifEmpty={() => (
          <Text layerStyle="loadingMessage">
            <Trans>No Organizations</Trans>
          </Text>
        )}
        mb="4"
      >
        {({ id, name, slug, acronym, domainCount, verified, summaries, userHasPermission }, index) => (
          <ErrorBoundary key={`${slug}:${index}`} ErrorFallbackComponent={ErrorFallbackMessage}>
            <Flex align="center">
              <ListItem mb="3" mr={userHasPermission ? '3rem' : '2'} w="100%">
                <OrganizationCard
                  disableLink={true}
                  id={id}
                  slug={slug}
                  name={name}
                  acronym={acronym}
                  domainCount={domainCount}
                  verified={verified}
                  summaries={summaries}
                />
              </ListItem>
              {isLoggedIn() && !userHasPermission && (
                <>
                  <IconButton
                    aria-label={t`Request Invite`}
                    variant="primary"
                    icon={<UserIcon color="white" boxSize="icons.md" />}
                    onClick={() => {
                      setOrgInfo({ id, name })
                      onOpen()
                    }}
                  />
                  {orgInfo.id === id && (
                    <RequestOrgInviteModal
                      isOpen={isOpen}
                      onClose={onClose}
                      orgId={orgInfo.id}
                      orgName={orgInfo.name}
                    />
                  )}
                </>
              )}
            </Flex>
          </ErrorBoundary>
        )}
      </ListOf>
    )

    return (
      <Box align="center" w="100%" px={4}>
        <Text textAlign="center" fontSize="2xl" fontWeight="bold">
          <Trans>
            Error while retrieving scan data for {domainName}. <br />
            This could be due to insufficient user privileges or the Domain does not exist in the system. You can
            request access to an Organization below to view the Domain results
          </Trans>
        </Text>

        <Heading as="h1" textAlign="middle" mb="4" mt="4">
          <Trans>Organizations</Trans>
        </Heading>
        <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>{orgList}</ErrorBoundary>
      </Box>
    )
  }

  if (error) {
    return <ErrorFallbackMessage error={error} />
  }

  let guidanceResults
  if (rcode !== 'NOERROR') {
    guidanceResults = (
      <Box fontSize="lg">
        <Flex>
          <Text mr="1">
            <Trans>A DNS request for this service has resulted in the following error code:</Trans>
          </Text>
          <Text fontWeight="bold">{rcode}</Text>
        </Flex>
        <Text>
          <Trans>
            If you believe this could be the result of an issue with the scan, rescan the service using the refresh
            button. If you believe this is because the service no longer exists (NXDOMAIN), this domain should be
            removed from all affiliated organizations.
          </Trans>
        </Text>
      </Box>
    )
  } else {
    const { results: webResults, timestamp } = webScan?.edges[0]?.node
    const { node: dnsResults } = dnsScan?.edges[0]

    const noScanData = (
      <Flex fontSize="xl" fontWeight="bold" textAlign="center" px="2" py="1">
        <Text>
          <Trans>
            No scan data is currently available for this service. You may request a scan using the refresh button, or
            wait up to 24 hours for data to refresh.
          </Trans>
        </Text>
      </Flex>
    )

    guidanceResults = (
      <Tabs
        isFitted
        variant="enclosed-colored"
        defaultIndex={activeTab ? tabNames.indexOf(activeTab) : tabNames[0]}
        onChange={(i) => changeActiveTab(i)}
        isLazy
      >
        <TabList mb="4">
          <Tab borderTopWidth="0.25">
            <Trans>Web Guidance</Trans>
          </Tab>
          <Tab borderTopWidth="0.25">
            <Trans>Email Guidance</Trans>
          </Tab>
          <Tab borderTopWidth="0.25">
            <Trans>Additional Findings</Trans>
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            {webResults.length === 0 ? (
              noScanData
            ) : (
              <WebGuidance webResults={webResults} status={status} timestamp={timestamp} />
            )}
          </TabPanel>
          <TabPanel>
            {dnsScan.edges.length === 0 ? (
              noScanData
            ) : (
              <EmailGuidance
                dnsResults={dnsResults}
                dmarcPhase={dmarcPhase}
                status={status}
                mxRecordDiff={mxRecordDiff}
              />
            )}
          </TabPanel>
          <TabPanel>
            <AdditionalFindings domain={domainName} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    )
  }

  return (
    <Flex flexDirection="column" width="100%">
      <Flex flexDirection={{ base: 'column', md: 'row' }} alignItems="center" mb="4">
        <IconButton
          icon={<ArrowLeftIcon />}
          onClick={() => navigate(`${from}${searchParams}`)}
          color="gray.900"
          fontSize="2xl"
          aria-label="back"
          mr="0.5rem"
        />
        <Heading textAlign={{ base: 'center', md: 'left' }} mr="auto">
          {domainName.toUpperCase()}
        </Heading>
        {webScanPending && (
          <Badge color="info" alignSelf="center" fontSize="md">
            <Trans>Scan Pending</Trans>
          </Badge>
        )}

        {wildcardSibling && (
          <Badge ml="2" colorScheme={wildcardEntry ? 'red' : 'blue'} variant="subtle" alignSelf="center">
            {wildcardEntry ? <Trans>Wildcard Entry</Trans> : <Trans>Wildcard Sibling</Trans>}
          </Badge>
        )}

        {isLoggedIn() && (
          <IconButton
            onClick={async () => {
              await favouriteDomain({ variables: { domainId } })
            }}
            variant="primary"
            aria-label={`favourite ${domainName}`}
            icon={<StarIcon />}
            ml="2"
          />
        )}
        {isLoggedIn() && isEmailValidated() && <ScanDomainButton domainUrl={domainName} ml="2" />}
        {hasDMARCReport && (
          <Button
            ml="2"
            variant="primary"
            as={RouteLink}
            to={`/domains/${domainName}/dmarc-report/LAST30DAYS/${new Date().getFullYear()}`}
          >
            <Text whiteSpace="noWrap">
              <Trans>DMARC Report</Trans>
            </Text>
          </Button>
        )}
      </Flex>
      <Flex maxW="auto" mb="2" px="2" py="1">
        <Text fontWeight="bold" mr="2">
          <Trans>Organization(s):</Trans>
        </Text>
        {organizations.edges.map(({ node }, idx) => {
          return (
            <React.Fragment key={idx}>
              <Link as={RouteLink} to={`/organizations/${node.slug}`}>
                {node.name} ({node.acronym})
              </Link>
              {idx !== organizations.edges.length - 1 && <Text mr="1">,</Text>}
            </React.Fragment>
          )
        })}
      </Flex>
      {guidanceResults}
    </Flex>
  )
}

export default GuidancePage
