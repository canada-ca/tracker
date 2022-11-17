import { ArrowLeftIcon } from '@chakra-ui/icons'
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Code,
  Flex,
  Heading,
  IconButton,
  Select,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from '@chakra-ui/react'
import { Trans } from '@lingui/macro'
import React, { useState } from 'react'
import { ScanDomainButton } from '../domains/ScanDomainButton'
import { Link as RouteLink } from 'react-router-dom'
import { GuidanceTagList } from '../guidance/GuidanceTagList'
import { StatusIcon } from '../components/StatusIcon'
import { AlertIcon } from '../components/AlertIcon'
import { StatusBadge } from '../domains/StatusBadge'
const { data } = require('./new_scan_results.json')

function NewGuidancePage() {
  const {
    domain: domainName,
    web: webScan,
    dnsScan,
    status,
    // dmarcPhase,
  } = data.findDomainByDomain

  const { results: webResults } = webScan.edges[0].node
  const { node: dnsResults } = dnsScan.edges[0]
  const [selectedEndpoint, setSelectedEndpoint] = useState(
    webResults[0].ipAddress,
  )

  const endPointSummary = <Box>Endpoint Summary</Box>

  const endpointSelect = (
    <Flex align="center" py="2">
      <Text fontWeight="bold" mr="2">
        Endpoint:
      </Text>
      <Select
        w="auto"
        onChange={(e) => {
          setSelectedEndpoint(e.target.value)
        }}
      >
        {webResults.map(({ ipAddress }, idx) => {
          return (
            <option key={idx} value={ipAddress}>
              {ipAddress}
            </option>
          )
        })}
      </Select>
    </Flex>
  )

  const { connectionResults, tlsResult } = webResults.find(({ ipAddress }) => {
    return ipAddress === selectedEndpoint
  }).results

  const tlsProtocols = <Box>Protocols</Box>

  const tlsCiphers = <Box>Ciphers</Box>

  const tlsCurves = <Box>Curves</Box>

  const connectionGuidance = (
    <Accordion allowMultiple>
      <AccordionItem>
        <Flex as={AccordionButton}>
          <StatusIcon status="PASS" boxSize="icons.lg" />
          <Text fontSize="2xl" ml="2">
            Connection Results
          </Text>{' '}
          <AccordionIcon boxSize="icons.xl" />
        </Flex>
        <AccordionPanel>
          <StatusBadge
            text="HTTPS"
            status={status.https}
            flexDirection="row"
            justifyContent=""
            spacing={2}
            align="center"
            fontSize="lg"
          />
          <StatusBadge
            text="HSTS"
            status={status.hsts}
            flexDirection="row"
            justifyContent=""
            spacing={2}
            align="center"
            fontSize="lg"
          />
          <GuidanceTagList
            positiveTags={connectionResults.positiveTags}
            neutralTags={connectionResults.neutralTags}
            negativeTags={connectionResults.negativeTags}
          />
          <Accordion allowMultiple>
            <AccordionItem>
              <Flex as={AccordionButton}>
                <Text fontSize="xl">Scan Results</Text>{' '}
                <AccordionIcon boxSize="icons.lg" />
              </Flex>
              <AccordionPanel>
                <Code>
                  {JSON.stringify(connectionResults.httpsChainResult)}
                </Code>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  )

  const tlsGuidance = (
    <Box py="2">
      <Accordion allowMultiple>
        <AccordionItem>
          <Flex as={AccordionButton}>
            <AlertIcon number={tlsResult.negativeTags.length} status="FAIL" />
            <Text fontSize="2xl" ml="2">
              TLS Results
            </Text>{' '}
            <AccordionIcon boxSize="icons.xl" />
          </Flex>
          <AccordionPanel>
            <GuidanceTagList
              positiveTags={tlsResult.positiveTags}
              neutralTags={tlsResult.neutralTags}
              negativeTags={tlsResult.negativeTags}
            />
            {tlsProtocols}
            {tlsCiphers}
            {tlsCurves}
            <Accordion allowMultiple>
              <AccordionItem>
                <Flex as={AccordionButton}>
                  <Text fontSize="xl">Certificate Chain Info</Text>{' '}
                  <AccordionIcon boxSize="icons.xl" />
                </Flex>
                <AccordionPanel>
                  <Code maxW="100%">
                    {JSON.stringify(tlsResult.certificateChainInfo)}
                  </Code>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </Box>
  )

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
          <Tab borderTopWidth="0.25">Web Guidance</Tab>
          <Tab borderTopWidth="0.25">Email Guidance</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            {/* web guidance */}
            {endPointSummary}
            {endpointSelect}
            <Box>
              {connectionGuidance}
              {tlsGuidance}
            </Box>
          </TabPanel>
          <TabPanel>
            {/* email guidance */}
            {JSON.stringify(dnsResults)}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Flex>
  )
}

export default NewGuidancePage
