import React, { useState } from 'react'
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Flex,
  Select,
  Text,
} from '@chakra-ui/react'
import { array } from 'prop-types'
import { Trans } from '@lingui/macro'
import { WebTLSResults } from './WebTLSResults'
import { WebConnectionResults } from './WebConnectionResults'
import { GuidanceSummaryCategories } from './GuidanceSummaryCategories'

export function WebGuidance({ webResults }) {
  const [selectedEndpoint, setSelectedEndpoint] = useState(webResults[0].ipAddress)

  let totalWebPass = 0
  let totalWebInfo = 0
  let totalWebFail = 0
  webResults.forEach(({ results }) => {
    const { positiveTags: tlsPass, neutralTags: tlsInfo, negativeTags: tlsFail } = results.tlsResult
    const { positiveTags: httpsPass, neutralTags: httpsInfo, negativeTags: httpsFail } = results.connectionResults

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
        <Text fontSize="2xl">
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
              <Text fontSize="xl" pl="2">
                {ipAddress}
              </Text>
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

  return (
    <>
      <Accordion allowMultiple defaultIndex={[0, 1, 2]}>
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
}
