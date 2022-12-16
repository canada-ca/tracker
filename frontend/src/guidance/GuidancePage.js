import React from 'react'
import { ArrowLeftIcon } from '@chakra-ui/icons'
import {
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
import { DOMAIN_GUIDANCE_PAGE, ORG_DETAILS_PAGE } from '../graphql/queries'
import { LoadingMessage } from '../components/LoadingMessage'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'

function GuidancePage() {
  const { domainSlug: domain } = useParams()

  const { loading, error, data } = useQuery(DOMAIN_GUIDANCE_PAGE, {
    variables: { domain: domain },
    // errorPolicy: 'ignore', // allow partial success
  })

  const history = useHistory()
  const location = useLocation()
  const { from } = location.state || { from: { pathname: '/domains' } }

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

  const { domain: domainName, web: webScan, dnsScan, organizations, dmarcPhase } = data.findDomainByDomain

  const { results: webResults } = webScan.edges[0].node
  const { node: dnsResults } = dnsScan.edges[0]

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
        <Heading textAlign={{ base: 'center', md: 'left' }}>{domainName.toUpperCase()}</Heading>
        <ScanDomainButton domainUrl={domainName} ml="auto" />
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
            <WebGuidance webResults={webResults} />
          </TabPanel>
          <TabPanel>
            <EmailGuidance dnsResults={dnsResults} dmarcPhase={dmarcPhase} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Flex>
  )
}

export default GuidancePage
