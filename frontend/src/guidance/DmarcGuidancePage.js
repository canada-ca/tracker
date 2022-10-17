import React, { useEffect } from 'react'
import { useQuery } from '@apollo/client'
import {
  Heading,
  Link,
  Box,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  IconButton,
} from '@chakra-ui/react'
import { ArrowLeftIcon, LinkIcon } from '@chakra-ui/icons'
import {
  Link as RouteLink,
  useParams,
  useLocation,
  useHistory,
} from 'react-router-dom'
import { Trans } from '@lingui/macro'
import { ErrorBoundary } from 'react-error-boundary'

import { ScanCard } from './ScanCard'

import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { LoadingMessage } from '../components/LoadingMessage'
import { useDocumentTitle } from '../utilities/useDocumentTitle'
import { GET_GUIDANCE_TAGS_OF_DOMAIN } from '../graphql/queries'
import { ScanDomainButton } from '../domains/ScanDomainButton'
import {SubdomainWarning} from "../domains/SubdomainWarning"

export default function DmarcGuidancePage() {
  const { domainSlug, activeTab } = useParams()
  const history = useHistory()
  const location = useLocation()
  const { from } = location.state || { from: { pathname: '/domains' } }
  const tabNames = ['web', 'email']
  const defaultActiveTab = tabNames[0]

  useDocumentTitle(`${domainSlug}`)

  const { loading, error, data } = useQuery(GET_GUIDANCE_TAGS_OF_DOMAIN, {
    variables: { domain: domainSlug },
  })

  useEffect(() => {
    if (!activeTab) {
      history.replace(`/domains/${domainSlug}/${defaultActiveTab}`)
    }
  }, [activeTab, history, domainSlug, defaultActiveTab])

  if (loading)
    return (
      <LoadingMessage>
        <Trans>Guidance Tags</Trans>
      </LoadingMessage>
    )
  if (error) return <ErrorFallbackMessage error={error} />

  const {
    domain: domainName,
    web: webScan,
    email: emailScan,
    status: webStatus,
    dmarcPhase,
  } = data.findDomainByDomain

  const changeActiveTab = (index) => {
    const tab = tabNames[index]
    if (activeTab !== tab) {
      history.replace(`/domains/${domainSlug}/${tab}`)
    }
  }
  return (
    <Stack spacing="25px" mb="6" px="4" mx="auto" minW="100%">
      <Box d={{ md: 'flex' }}>
        <IconButton
          icon={<ArrowLeftIcon />}
          onClick={() => history.push(from)}
          color="gray.900"
          fontSize="2xl"
          aria-label="back"
          mr="0.5rem"
        />
        <Heading textAlign={{ base: 'center', md: 'left' }}>
          {domainName.toUpperCase()}
        </Heading>
        <ScanDomainButton domainUrl={data.findDomainByDomain.domain} ml="auto"/>
        {data.findDomainByDomain.hasDMARCReport && (
          <Link
            color="teal.600"
            whiteSpace="noWrap"
            my="auto"
            ml={4}
            to={`/domains/${domainSlug}/dmarc-report/LAST30DAYS/${new Date().getFullYear()}`}
            as={RouteLink}
            d="block"
            textAlign={{ base: 'center', md: 'right' }}
          >
            <Trans>DMARC Report</Trans>
            <LinkIcon ml="4px" aria-hidden="true" />
          </Link>
        )}
      </Box>
      <Tabs
        isFitted
        variant="enclosed-colored"
        defaultIndex={activeTab ? tabNames.indexOf(activeTab) : tabNames[0]}
        onChange={(i) => changeActiveTab(i)}
      >
        <TabList mb="4">
          <Tab borderTopWidth="4px">
            <Trans>Web Guidance</Trans>
          </Tab>
          <Tab borderTopWidth="4px">
            <Trans>Email Guidance</Trans>
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
              <SubdomainWarning mb="4"/>
              <ScanCard scanType="web" scanData={webScan} status={webStatus} />
            </ErrorBoundary>
          </TabPanel>
          <TabPanel>
            <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
              <ScanCard
                scanType="email"
                scanData={emailScan}
                status={dmarcPhase}
              />
            </ErrorBoundary>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Stack>
  )
}
