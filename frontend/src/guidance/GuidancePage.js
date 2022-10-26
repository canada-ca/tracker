import React, { useEffect } from 'react'
import PropTypes from 'prop-types'
import {
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Flex,
  IconButton,
  Heading,
  Link,
} from '@chakra-ui/react'

import { GET_GUIDANCE_TAGS_OF_DOMAIN } from '../graphql/queries'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { useQuery } from '@apollo/client'
import { LoadingMessage } from '../components/LoadingMessage'
import { Trans } from '@lingui/macro'
import {
  Link as RouteLink,
  useHistory,
  useLocation,
  useParams,
} from 'react-router-dom'
import { ArrowLeftIcon, LinkIcon } from '@chakra-ui/icons'
import { ScanDomainButton } from '../domains/ScanDomainButton'
import WebGuidance from './WebGuidance'
import EmailGuidance from './EmailGuidance'

const GuidancePage = () => {
  const { domainSlug, activeTab } = useParams()
  const history = useHistory()
  const location = useLocation()
  const { from } = location.state || { from: { pathname: '/domains' } }
  const tabNames = ['web', 'email']
  const defaultActiveTab = tabNames[0]

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
    <Flex flexDirection="column" width="100%">
      <Flex
        flexDirection={{ base: 'column', md: 'row' }}
        alignItems="center"
        mb="4"
      >
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
        <ScanDomainButton
          domainUrl={data.findDomainByDomain.domain}
          ml="auto"
        />
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
      </Flex>
      <Tabs
        isFitted
        variant="enclosed-colored"
        defaultIndex={activeTab ? tabNames.indexOf(activeTab) : tabNames[0]}
        onChange={(i) => changeActiveTab(i)}
      >
        <TabList mb="4">
          <Tab borderTopWidth="0.25">Web Guidance</Tab>
          <Tab borderTopWidth="0.25">Email Guidance</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
              <WebGuidance
                webScan={webScan}
                sslStatus={webStatus.ssl}
                httpsStatus={webStatus.https}
              />
            </ErrorBoundary>
          </TabPanel>
          <TabPanel>
            <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
              <EmailGuidance emailScan={emailScan} dmarcPhase={dmarcPhase} />
            </ErrorBoundary>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Flex>
  )
}

GuidancePage.propTypes = {
  children: PropTypes.element,
}

export default GuidancePage
