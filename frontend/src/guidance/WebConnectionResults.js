import React from 'react'
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Code,
  Flex,
  Text,
} from '@chakra-ui/react'
import { bool, object } from 'prop-types'
import { PlusSquareIcon } from '@chakra-ui/icons'
import { StatusIcon } from '../components/StatusIcon'
import { GuidanceTagList } from './GuidanceTagList'
import { t, Trans } from '@lingui/macro'
import { DetailTooltip } from './DetailTooltip'

export function WebConnectionResults({ connectionResults, isWebHosting }) {
  const {
    httpLive,
    httpsLive,
    httpImmediatelyUpgrades,
    httpEventuallyUpgrades,
    httpsImmediatelyDowngrades,
    httpsEventuallyDowngrades,
    hstsParsed,
    httpChainResult,
    httpsChainResult,
  } = connectionResults

  const columnInfoStyleProps = {
    align: 'center',
    py: '0.5',
    px: '2',
    _even: { bg: 'gray.200' },
  }

  const connChainResult = (chainResult) =>
    chainResult.connections.map(({ uri, connection, error }, idx) => {
      if (error) {
        return (
          <Box key={idx} px="2" m="2" borderWidth="1px" bg="gray.100" borderColor="gray.300">
            <Text>
              {idx + 1}. {uri}
            </Text>
            <Text color="weak">{error}</Text>
          </Box>
        )
      } else {
        const { statusCode, headers, blockedCategory, HSTS } = connection
        return (
          <AccordionItem key={idx}>
            <Box px="2" m="2" borderWidth="1px" bg="gray.100" borderColor="gray.300">
              <Text>
                {idx + 1}. {uri}
              </Text>

              <Text>
                <Trans>Status:</Trans> {statusCode}
              </Text>

              <Text>{blockedCategory}</Text>
              <Text>{HSTS}</Text>

              <AccordionButton color="blue.500" variant="link">
                <PlusSquareIcon mr="1" />
                <Trans>See headers</Trans>
              </AccordionButton>
              <AccordionPanel>
                <Code>
                  {Object.keys(headers).map((key, idx) => {
                    return (
                      <Text key={idx}>
                        {key}: {headers[key]}
                      </Text>
                    )
                  })}
                </Code>
              </AccordionPanel>
            </Box>
          </AccordionItem>
        )
      }
    })

  let connectionResultsStatus = 'FAIL'
  if (
    [(connectionResults.httpsStatus, connectionResults.hstsStatus)].every((status) => status.toUpperCase() === 'PASS')
  )
    connectionResultsStatus = 'PASS'
  else if (
    [(connectionResults.httpsStatus, connectionResults.hstsStatus)].every((status) => status.toUpperCase() === 'INFO')
  )
    connectionResultsStatus = 'INFO'

  return (
    <AccordionItem>
      <Flex as={AccordionButton}>
        <StatusIcon status={connectionResultsStatus} boxSize="icons.lg" />
        <Text fontSize="2xl" ml="2">
          <Trans>Connection Results</Trans>
        </Text>
        <AccordionIcon boxSize="icons.xl" />
      </Flex>
      <AccordionPanel>
        <GuidanceTagList
          positiveTags={connectionResults.positiveTags}
          neutralTags={connectionResults.neutralTags}
          negativeTags={connectionResults.negativeTags}
        />
        <Accordion allowMultiple defaultIndex={[0, 1]}>
          <AccordionItem>
            <Flex as={AccordionButton}>
              <Text fontSize="xl">
                <Trans>HTTP (80) Chain</Trans>
              </Text>{' '}
              <AccordionIcon boxSize="icons.lg" />
            </Flex>
            <AccordionPanel>
              <Box fontSize="lg" px="2">
                <Flex {...columnInfoStyleProps}>
                  <DetailTooltip label={t`Shows if the HTTP connection is live.`}>
                    <StatusIcon status="INFO" />
                    <Text px="1">
                      <Trans>HTTP Live</Trans>
                    </Text>
                  </DetailTooltip>
                  <Text>{httpLive ? t`Yes` : t`No`}</Text>
                </Flex>
                <Flex {...columnInfoStyleProps}>
                  <DetailTooltip
                    label={t`Shows if the HTTP endpoint upgrades to HTTPS upgrade immediately, eventually (after the first redirect), or never.`}
                  >
                    <StatusIcon status={!httpLive ? 'INFO' : httpImmediatelyUpgrades ? 'PASS' : 'FAIL'} />
                    <Text px="1">
                      <Trans>HTTP Upgrades</Trans>
                    </Text>
                  </DetailTooltip>
                  <Text>
                    {!httpLive
                      ? t`Not available`
                      : httpImmediatelyUpgrades
                      ? t`Immediately`
                      : httpEventuallyUpgrades
                      ? t`Eventually`
                      : t`Never`}
                  </Text>
                </Flex>
              </Box>
              <Text mt="2" fontWeight="bold" mx="2">
                <Trans>URL:</Trans> {httpChainResult.uri}
              </Text>
              <Accordion allowMultiple defaultIndex={[]}>
                {connChainResult(httpChainResult)}
              </Accordion>
            </AccordionPanel>
          </AccordionItem>
          <AccordionItem>
            <Flex as={AccordionButton}>
              <Text fontSize="xl">
                <Trans>HTTPS (443) Chain</Trans>
              </Text>
              <AccordionIcon boxSize="icons.lg" />
            </Flex>
            <AccordionPanel>
              <Box fontSize="lg" px="2">
                <Flex {...columnInfoStyleProps}>
                  <DetailTooltip label={t`Shows if the HTTPS connection is live.`}>
                    <StatusIcon status={!isWebHosting ? 'INFO' : httpsLive ? 'PASS' : 'FAIL'} />
                    <Text px="1">
                      <Trans>HTTPS Live</Trans>
                    </Text>
                  </DetailTooltip>
                  <Text>{httpsLive ? t`Yes` : t`No`}</Text>
                </Flex>
                <Flex {...columnInfoStyleProps}>
                  <DetailTooltip
                    label={t`Shows if the HTTPS endpoint downgrades to unsecured HTTP immediately, eventually, or never.`}
                  >
                    <StatusIcon
                      status={
                        !isWebHosting
                          ? 'INFO'
                          : httpsImmediatelyDowngrades || httpsEventuallyDowngrades
                          ? 'FAIL'
                          : 'PASS'
                      }
                    />
                    <Text px="1">
                      <Trans>HTTPS Downgrades</Trans>
                    </Text>
                  </DetailTooltip>
                  <Text>
                    {httpsImmediatelyDowngrades ? t`Immediately` : httpsEventuallyDowngrades ? t`Eventually` : t`Never`}
                  </Text>
                </Flex>
                <Flex {...columnInfoStyleProps}>
                  <DetailTooltip label={t`Shows if the HSTS (HTTP Strict Transport Security) header is present.`}>
                    <StatusIcon status={!isWebHosting ? 'INFO' : hstsParsed ? 'PASS' : 'FAIL'} />
                    <Text px="1">
                      <Trans>HSTS Parsed</Trans>
                    </Text>
                  </DetailTooltip>
                  <Text>{hstsParsed ? t`Yes` : t`No`}</Text>
                </Flex>
                <Flex {...columnInfoStyleProps}>
                  <DetailTooltip label={t`Shows the duration of time, in seconds, that the HSTS header is valid.`}>
                    <StatusIcon status="INFO" />
                    <Text px="1">
                      <Trans>HSTS Max Age</Trans>
                    </Text>
                  </DetailTooltip>
                  <Text>{hstsParsed?.maxAge || t`Not available`}</Text>
                </Flex>
                <Flex {...columnInfoStyleProps}>
                  <DetailTooltip label={t`Shows if the HSTS header includes the preload directive.`}>
                    <StatusIcon status="INFO" />
                    <Text px="1">
                      <Trans>HSTS Preloaded</Trans>
                    </Text>
                  </DetailTooltip>
                  <Text>{!hstsParsed ? t`Not available` : hstsParsed?.preload ? t`Yes` : t`No`}</Text>
                </Flex>
                <Flex {...columnInfoStyleProps}>
                  <DetailTooltip label={t`Shows if the HSTS header includes the includeSubdomains directive.`}>
                    <StatusIcon status="INFO" />
                    <Text px="1">
                      <Trans>HSTS Includes Subdomains</Trans>
                    </Text>
                  </DetailTooltip>
                  <Text>{!hstsParsed ? t`Not available` : hstsParsed?.includeSubdomains ? t`Yes` : t`No`}</Text>
                </Flex>
              </Box>
              <Text mt="2" fontWeight="bold" mx="2">
                <Trans>URL: </Trans> {httpsChainResult?.uri}
              </Text>
              <Accordion allowMultiple defaultIndex={[]}>
                {connChainResult(httpsChainResult)}
              </Accordion>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </AccordionPanel>
    </AccordionItem>
  )
}

WebConnectionResults.propTypes = {
  connectionResults: object,
  isWebHosting: bool,
}
