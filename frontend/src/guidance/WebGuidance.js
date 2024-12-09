import React, { useState } from 'react'
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  AlertDescription,
  AlertTitle,
  Badge,
  Box,
  Flex,
  Link,
  Select,
  Text,
} from '@chakra-ui/react'
import { array } from 'prop-types'
import { Trans } from '@lingui/macro'
import { WebTLSResults } from './WebTLSResults'
import { WebConnectionResults } from './WebConnectionResults'
import { GuidanceSummaryCategories } from './GuidanceSummaryCategories'
import { string } from 'prop-types'
import { NotificationBanner } from '../app/NotificationBanner'

export function WebGuidance({ webResults, timestamp }) {
  const [selectedEndpoint, setSelectedEndpoint] = useState(webResults[0].ipAddress)

  let totalWebPass = 0
  let totalWebInfo = 0
  let totalWebFail = 0
  let isWebHosting = false
  webResults.forEach(({ results }) => {
    if (!results) {
      return
    }
    const { positiveTags: tlsPass, neutralTags: tlsInfo, negativeTags: tlsFail } = results.tlsResult
    const {
      positiveTags: httpsPass,
      neutralTags: httpsInfo,
      negativeTags: httpsFail,
      httpLive,
      httpsLive,
    } = results.connectionResults

    if (!isWebHosting && (httpLive || httpsLive)) {
      isWebHosting = true
    }

    const endpointPass = tlsPass.length + httpsPass.length
    const endpointInfo = tlsInfo.length + httpsInfo.length
    const endpointFail = tlsFail.length + httpsFail.length

    totalWebPass += endpointPass
    totalWebInfo += endpointInfo
    totalWebFail += endpointFail
  })

  const endPointSummary = (
    <AccordionItem>
      <Flex align="center" as={AccordionButton}>
        <Text fontSize="2xl" mr="auto">
          <Trans>Endpoint Summary</Trans>
          <AccordionIcon boxSize="icons.xl" />
        </Text>
        <GuidanceSummaryCategories passCount={totalWebPass} infoCount={totalWebInfo} failCount={totalWebFail} />
      </Flex>
      <AccordionPanel>
        {webResults.map(({ ipAddress, isPrivateIp, results }, idx) => {
          let endpointPass = 0
          let endpointInfo = 0
          let endpointFail = 0

          if (results) {
            const { positiveTags: tlsPass, neutralTags: tlsInfo, negativeTags: tlsFail } = results.tlsResult
            const {
              positiveTags: httpsPass,
              neutralTags: httpsInfo,
              negativeTags: httpsFail,
            } = results.connectionResults

            endpointPass = tlsPass.length + httpsPass.length
            endpointInfo = tlsInfo.length + httpsInfo.length
            endpointFail = tlsFail.length + httpsFail.length
          }

          return (
            <Flex
              key={idx}
              align="center"
              py="1"
              borderTopColor={idx === 0 ? 'gray.300' : ''}
              borderTopWidth={idx === 0 ? '1px' : ''}
              borderBottomWidth="1px"
              borderBottomColor="gray.300"
            >
              <Text fontSize="xl" pl="2" mr="auto">
                {ipAddress}
              </Text>

              {results?.connectionResults?.httpsChainResult?.connections?.[0]?.connection?.blockedCategory && (
                <Badge colorScheme="red" alignSelf="center" fontSize="md" mr="1">
                  <Trans>Blocked</Trans>
                </Badge>
              )}
              {isPrivateIp && (
                <Badge colorScheme="blue" alignSelf="center" fontSize="md" mr="1">
                  <Trans>Private IP</Trans>
                </Badge>
              )}
              <GuidanceSummaryCategories passCount={endpointPass} infoCount={endpointInfo} failCount={endpointFail} />
            </Flex>
          )
        })}
      </AccordionPanel>
    </AccordionItem>
  )

  const endpointSelect = (
    <Flex align="center" py="2" ml="3">
      <Text fontWeight="bold" mr="2" fontSize="xl">
        <Trans>Endpoint:</Trans>
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

  const currentEndpoint = webResults.find(({ ipAddress }) => {
    return ipAddress === selectedEndpoint
  })

  const formatTimestamp = (ts) => {
    const date = new Date(ts)
    return date.toLocaleString('en-CA', {
      timeZoneName: 'short',
    })
  }

  return (
    <>
      <NotificationBanner status="info" bannerId="updated-tls-guidance" hideable>
        <Box>
          <AlertTitle>
            <Trans>New Recommended TLS Ciphers</Trans>
          </AlertTitle>
          <AlertDescription>
            <Trans>
              CCCS has updated their{' '}
              <Link
                isExternal
                href="https://www.cyber.gc.ca/en/guidance/guidance-securely-configuring-network-protocols-itsp40062#tab2"
                color="blue.500"
              >
                list of recommended TLS cipher suites and elliptic curves
              </Link>
              . Please review these findings and update your configurations accordingly.
            </Trans>
          </AlertDescription>
        </Box>
      </NotificationBanner>
      <Accordion allowMultiple defaultIndex={[0, 1, 2]}>
        <Text fontSize="lg">
          <Trans>
            <b>Last Scanned:</b> {formatTimestamp(timestamp)}
          </Trans>
        </Text>
        {!isWebHosting && (
          <Flex
            fontSize="lg"
            fontWeight="bold"
            px="2"
            py="1"
            textAlign="center"
            borderWidth="1px"
            borderColor="black"
            rounded="md"
          >
            <Text>
              <Trans>
                This service is not web-hosting and does not require compliance with the Web Sites and Services
                Management Configuration Requirements.
              </Trans>
            </Text>
          </Flex>
        )}
        {endPointSummary}
        {endpointSelect}
        {currentEndpoint.isPrivateIp && (
          <Flex
            fontSize="lg"
            fontWeight="bold"
            px="2"
            py="1"
            textAlign="center"
            borderWidth="1px"
            borderColor="black"
            rounded="md"
          >
            <Text>
              <Trans>
                The selected endpoint is a private IP address. Tracker does not perform scans on private IP addresses.
              </Trans>
            </Text>
          </Flex>
        )}
        {currentEndpoint.results && (
          <>
            <WebConnectionResults
              isWebHosting={isWebHosting}
              connectionResults={currentEndpoint.results.connectionResults}
            />
            <WebTLSResults tlsResult={currentEndpoint.results.tlsResult} />
          </>
        )}
      </Accordion>
    </>
  )
}

WebGuidance.propTypes = {
  webResults: array,
  timestamp: string,
}
