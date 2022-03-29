import React from 'react'
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
import { Link as RouteLink, useParams, useHistory } from 'react-router-dom'
import { Trans } from '@lingui/macro'
import { ErrorBoundary } from 'react-error-boundary'

import { ScanCard } from './ScanCard'

import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { LoadingMessage } from '../components/LoadingMessage'
import { useDocumentTitle } from '../utilities/useDocumentTitle'
import { GET_GUIDANCE_TAGS_OF_DOMAIN } from '../graphql/queries'

export default function DmarcGuidancePage() {
  const { domainSlug } = useParams()
  const history = useHistory()

  useDocumentTitle(`${domainSlug}`)

  const { loading, error, data } = useQuery(GET_GUIDANCE_TAGS_OF_DOMAIN, {
    variables: {
      domain: domainSlug,
    },
    onComplete: (stuff) => console.log(`completed! recieved: ${stuff}`),
    onError: (e) => console.log(`error! recieved: ${e}`),
  })

  if (loading)
    return (
      <LoadingMessage>
        <Trans>Guidance Tags</Trans>
      </LoadingMessage>
    )
  if (error) return <ErrorFallbackMessage error={error} />

  const domainName = data.findDomainByDomain.domain
  const webScan = data.findDomainByDomain.web
  const emailScan = data.findDomainByDomain.email
  const webStatus = data.findDomainByDomain.status
  const dmarcPhase = data.findDomainByDomain.dmarcPhase
  return (
    <Stack spacing="25px" mb="6" px="4" mx="auto" minW="100%">
      <Box d={{ md: 'flex' }}>
        <IconButton
          icon={<ArrowLeftIcon />}
          onClick={() =>
            history.length > 0 ? history.goBack() : history.push('/domains')
          }
          color="gray.900"
          fontSize="2xl"
          aria-label="back"
          mr="0.5rem"
          order={0}
        />
        <Heading textAlign={{ base: 'center', md: 'left' }}>
          {domainName.toUpperCase()}
        </Heading>
        {data.findDomainByDomain.hasDMARCReport && (
          <Link
            color="teal.600"
            whiteSpace="noWrap"
            my="auto"
            ml="auto"
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
      <Tabs isFitted>
        <TabList mb="4">
          <Tab>
            <Trans>Web Guidance</Trans>
          </Tab>
          <Tab>
            <Trans>Email Guidance</Trans>
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
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
