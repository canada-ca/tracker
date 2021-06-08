import React from 'react'
import { useUserState } from './UserState'
import { useQuery } from '@apollo/client'
import { GET_GUIDANCE_TAGS_OF_DOMAIN } from './graphql/queries'
import {
  Heading,
  Stack,
  Icon,
  Link,
  PseudoBox,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/core'
import { useParams, Link as RouteLink } from 'react-router-dom'
import ScanCard from './ScanCard'
import { Trans } from '@lingui/macro'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'
import { ErrorBoundary } from 'react-error-boundary'
import { LoadingMessage } from './LoadingMessage'
import { useDocumentTitle } from './useDocumentTitle'

export default function DmarcGuidancePage() {
  const { currentUser } = useUserState()
  const { domainSlug } = useParams()

  useDocumentTitle(`${domainSlug}`)

  const { loading, error, data } = useQuery(GET_GUIDANCE_TAGS_OF_DOMAIN, {
    context: {
      headers: {
        authorization: currentUser.jwt,
      },
    },
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
    <Stack spacing="25px" mb="6" px="4" mx="auto">
      <PseudoBox d={{ md: 'flex' }}>
        <Heading textAlign={{ base: 'center', md: 'left' }}>
          {domainName.toUpperCase()}
        </Heading>
        {data.findDomainByDomain.hasDMARCReport && (
          <Link
            color="teal.500"
            whiteSpace="noWrap"
            my="auto"
            ml="auto"
            to={`/domains/${domainSlug}/dmarc-report/LAST30DAYS/${new Date().getFullYear()}`}
            as={RouteLink}
            d="block"
            textAlign={{ base: 'center', md: 'right' }}
          >
            <Trans>DMARC Report</Trans>
            <Icon name="link" ml="4px" />
          </Link>
        )}
      </PseudoBox>
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
