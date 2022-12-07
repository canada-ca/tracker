import React from 'react'
import { ArrowLeftIcon } from '@chakra-ui/icons'
import {
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
} from '@chakra-ui/react'
import { t, Trans } from '@lingui/macro'

import { ScanDomainButton } from '../domains/ScanDomainButton'
import { Link as RouteLink } from 'react-router-dom'
import { NewWebGuidance } from './NewWebGuidance'
import { NewEmailGuidance } from './NewEmailGuidance'
const { data } = require('./new_scan_results.json')

function NewGuidancePage() {
  const {
    domain: domainName,
    web: webScan,
    dnsScan,
    status,
    dmarcPhase,
  } = data.findDomainByDomain

  const { results: webResults } = webScan.edges[0].node
  const { node: dnsResults } = dnsScan.edges[0]

  return (
    <Flex flexDirection="column" width="100%">
      <Flex
        flexDirection={{ base: 'column', md: 'row' }}
        alignItems="center"
        mb="4"
      >
        <IconButton
          icon={<ArrowLeftIcon />}
          //   onClick={() => history.push(from)}
          color="gray.900"
          fontSize="2xl"
          aria-label="back"
          mr="0.5rem"
        />
        <Heading textAlign={{ base: 'center', md: 'left' }}>
          {domainName.toUpperCase()}
        </Heading>
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
      <Tabs isFitted variant="enclosed-colored">
        <TabList mb="4">
          <Tab borderTopWidth="0.25">WWW Guidance</Tab>
          <Tab borderTopWidth="0.25">Email Guidance</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <NewWebGuidance webResults={webResults} />
          </TabPanel>
          <TabPanel>
            <NewEmailGuidance dnsResults={dnsResults} dmarcPhase={dmarcPhase} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Flex>
  )
}

export default NewGuidancePage
