import React from 'react'
import { ArrowLeftIcon } from '@chakra-ui/icons'
import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  IconButton,
  Link,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from '@chakra-ui/react'

import { ScanDomainButton } from '../domains/ScanDomainButton'
import { Link as RouteLink, useHistory, useLocation, useParams } from 'react-router-dom'
import { WebGuidance } from './WebGuidance'
import { EmailGuidance } from './EmailGuidance'
import { Trans } from '@lingui/macro'
import { useQuery } from '@apollo/client'
import { DOMAIN_GUIDANCE_PAGE } from '../graphql/queries'
import { LoadingMessage } from '../components/LoadingMessage'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { useUserVar } from '../utilities/userState'

function GuidancePage() {
  const { domainSlug: domain } = useParams()

  const { loading, error, data } = useQuery(DOMAIN_GUIDANCE_PAGE, {
    variables: { domain: domain },
  })

  const history = useHistory()
  const location = useLocation()
  const { isLoggedIn, isEmailValidated } = useUserVar()
  const { from } = location.state || { from: { pathname: '/domains' } }

  if (loading) {
    return (
      <LoadingMessage>
        <Trans>Guidance results</Trans>
      </LoadingMessage>
    )
  }

  if (error) {
    return <ErrorFallbackMessage error={error} />
  }

  const {
    domain: domainName,
    web: webScan,
    dnsScan,
    organizations,
    dmarcPhase,
    rcode,
    status,
    userHasPermission,
  } = data.findDomainByDomain

  if (userHasPermission) {
    return (
      <Box align="center" w="100%" px={4}>
        <Text textAlign="center" fontSize="2xl" fontWeight="bold">
          <Trans>
            Error while retrieving scan data for {domainName}. <br />
            This could be due to insufficient user privileges or the domain does not exist in the system.
          </Trans>
        </Text>
      </Box>
    )
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
    const { results: webResults } = webScan?.edges[0]?.node
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
      <Tabs isFitted variant="enclosed-colored">
        <TabList mb="4">
          <Tab borderTopWidth="0.25">
            <Trans>Web Guidance</Trans>
          </Tab>
          <Tab borderTopWidth="0.25">
            <Trans>Email Guidance</Trans>
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            {webResults.length === 0 ? noScanData : <WebGuidance webResults={webResults} status={status} />}
          </TabPanel>
          <TabPanel>
            {dnsScan.edges.length === 0 ? (
              noScanData
            ) : (
              <EmailGuidance dnsResults={dnsResults} dmarcPhase={dmarcPhase} status={status} />
            )}
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
          onClick={() => history.push(from)}
          color="gray.900"
          fontSize="2xl"
          aria-label="back"
          mr="0.5rem"
        />
        <Heading textAlign={{ base: 'center', md: 'left' }} mr="auto">
          {domainName.toUpperCase()}
        </Heading>
        {data.findDomainByDomain.webScanPending && (
          <Badge color="info" alignSelf="center" fontSize="md">
            <Trans>Scan Pending</Trans>
          </Badge>
        )}
        {isLoggedIn() && isEmailValidated() && <ScanDomainButton domainUrl={domainName} ml="2" />}
        {data.findDomainByDomain.hasDMARCReport && (
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
            <>
              <Link as={RouteLink} to={`/organizations/${node.slug}`} key={idx}>
                {node.name} ({node.acronym})
              </Link>
              {idx !== organizations.edges.length - 1 && <Text mr="1">,</Text>}
            </>
          )
        })}
      </Flex>
      {guidanceResults}
    </Flex>
  )
}

export default GuidancePage
