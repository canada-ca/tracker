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

export function NewWebGuidance({ webResults }) {
  const [selectedEndpoint, setSelectedEndpoint] = useState(
    webResults[0].ipAddress,
  )

  let totalWebPass = 0
  let totalWebInfo = 0
  let totalWebFail = 0
  webResults.forEach(({ results }) => {
    const {
      positiveTags: tlsPass,
      neutralTags: tlsInfo,
      negativeTags: tlsFail,
    } = results.tlsResult
    const {
      positiveTags: httpsPass,
      neutralTags: httpsInfo,
      negativeTags: httpsFail,
    } = results.connectionResults

    const endpointPass = tlsPass.length + httpsPass.length
    const endpointInfo = tlsInfo.length + httpsInfo.length
    const endpointFail = tlsFail.length + httpsFail.length

    totalWebPass += endpointPass
    totalWebInfo += endpointInfo
    totalWebFail += endpointFail
  })

  const endPointSummary = (
    <Accordion allowMultiple defaultIndex={[0]}>
      <AccordionItem>
        <Flex align="center" as={AccordionButton}>
          <Text fontSize="2xl">
            <Trans>Endpoint Summary</Trans>
          </Text>
          <GuidanceSummaryCategories
            passCount={totalWebPass}
            infoCount={totalWebInfo}
            failCount={totalWebFail}
            mr="1"
          />
          <AccordionIcon boxSize="icons.xl" />
        </Flex>
        <AccordionPanel>
          {webResults.map(({ ipAddress, results }, idx) => {
            const {
              positiveTags: tlsPass,
              neutralTags: tlsInfo,
              negativeTags: tlsFail,
            } = results.tlsResult
            const {
              positiveTags: httpsPass,
              neutralTags: httpsInfo,
              negativeTags: httpsFail,
            } = results.connectionResults

            const endpointPass = tlsPass.length + httpsPass.length
            const endpointInfo = tlsInfo.length + httpsInfo.length
            const endpointFail = tlsFail.length + httpsFail.length

            return (
              <Flex key={idx} align="center" py="1">
                <Text fontSize="xl" pr="2">
                  {ipAddress}
                </Text>
                <GuidanceSummaryCategories
                  passCount={endpointPass}
                  infoCount={endpointInfo}
                  failCount={endpointFail}
                  mr="2.25rem"
                />
              </Flex>
            )
          })}
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
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
      {endPointSummary}
      {endpointSelect}
      <Accordion allowMultiple defaultIndex={[0, 1]}>
        <WebConnectionResults connectionResults={connectionResults} />
        <WebTLSResults tlsResult={tlsResult} />
      </Accordion>
    </>
  )
}

NewWebGuidance.propTypes = {
  webResults: array,
}
