import React, { useState } from 'react'
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Badge,
  Flex,
  Select,
  Text,
} from '@chakra-ui/react'
import { array } from 'prop-types'
import { Trans } from '@lingui/macro'
import { WebTLSResults } from './WebTLSResults'
import { WebConnectionResults } from './WebConnectionResults'
import { GuidanceSummaryCategories } from './GuidanceSummaryCategories'
import { string } from 'prop-types'

export function WebGuidance({ webResults, timestamp }) {
  const [selectedEndpoint, setSelectedEndpoint] = useState(webResults[0].ipAddress)

  let totalWebPass = 0
  let totalWebInfo = 0
  let totalWebFail = 0
  let isWebHosting = false
  webResults.forEach(({ results }) => {
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
        {webResults.map(({ ipAddress, results }, idx) => {
          const { positiveTags: tlsPass, neutralTags: tlsInfo, negativeTags: tlsFail } = results.tlsResult
          const { positiveTags: httpsPass, neutralTags: httpsInfo, negativeTags: httpsFail } = results.connectionResults

          const endpointPass = tlsPass.length + httpsPass.length
          const endpointInfo = tlsInfo.length + httpsInfo.length
          const endpointFail = tlsFail.length + httpsFail.length

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

              {results.connectionResults?.httpsChainResult?.connections?.[0]?.connection?.blockedCategory && (
                <Badge colorScheme="red" alignSelf="center" fontSize="md" mr="1">
                  <Trans>Blocked</Trans>
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

  const { connectionResults, tlsResult } = webResults.find(({ ipAddress }) => {
    return ipAddress === selectedEndpoint
  }).results

  const formatTimestamp = (ts) => {
    const dateTime = ts.split('T')
    return dateTime[0] + ', ' + dateTime[1].substring(0, 5)
  }

  return (
    <>
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
        <WebConnectionResults connectionResults={connectionResults} />
        <WebTLSResults tlsResult={tlsResult} />
      </Accordion>
    </>
  )
}

WebGuidance.propTypes = {
  webResults: array,
  timestamp: string,
}
