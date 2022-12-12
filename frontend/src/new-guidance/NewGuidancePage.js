import React from 'react'
import { ArrowLeftIcon } from '@chakra-ui/icons'
import {
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
import { Link as RouteLink, useHistory, useLocation } from 'react-router-dom'
import { NewWebGuidance } from './NewWebGuidance'
import { NewEmailGuidance } from './NewEmailGuidance'
import { t, Trans } from '@lingui/macro'
import { StatusBadge } from '../domains/StatusBadge'
const { data } = require('./new_scan_results.json')

function NewGuidancePage() {
  const {
    domain: domainName,
    web: webScan,
    dnsScan,
    organizations,
    status,
    dmarcPhase,
  } = data.findDomainByDomain

  const history = useHistory()
  const location = useLocation()
  const { from } = location.state || { from: { pathname: '/domains' } }

  const { results: webResults } = webScan.edges[0].node
  const { node: dnsResults } = dnsScan.edges[0]

  const statusGroupingProps = {
    flexDirection: { base: 'column', md: 'row' },
    border: '1px solid',
    borderColor: 'gray.300',
    borderRadius: 'md',
    px: { base: 2, md: 0 },
    py: { base: 1, md: 2 },
    mx: { base: 0, md: 1 },
    my: { base: 2, md: 0 },
    bg: 'gray.100',
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
      <Flex
        maxW="auto"
        mb="2"
        bg="gray.100"
        px="2"
        py="1"
        borderWidth="1px"
        borderColor="gray.300"
        rounded="md"
      >
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
      <Flex mb="4">
        <Box {...statusGroupingProps} px="1">
          <Text textAlign="center" color="gray.500">
            <Trans>Web (HTTPS/TLS)</Trans>
          </Text>
          <Flex>
            <StatusBadge text={t`HTTPS`} status={status.https} />
            <StatusBadge text={t`HSTS`} status={status.hsts} />
            <StatusBadge text={t`Protocols`} status={status.protocols} />
            <StatusBadge text={t`Ciphers`} status={status.ciphers} />
            <StatusBadge text={t`Curves`} status={status.curves} />
          </Flex>
        </Box>
        <Box {...statusGroupingProps} px="1">
          <Text textAlign="center" color="gray.500">
            <Trans>Email</Trans>
          </Text>
          <Flex>
            <StatusBadge text="SPF" status={status.spf} />
            <StatusBadge text="DKIM" status={status.dkim} />
            <StatusBadge text="DMARC" status={status.dmarc} />
          </Flex>
        </Box>
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
