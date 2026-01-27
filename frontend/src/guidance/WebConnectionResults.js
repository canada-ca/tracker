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
import { SecurityTxt } from './SecurityTxt'
import { ABTestVariant, ABTestWrapper } from '../app/ABTestWrapper'

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

  let connectionResultsStatus = 'FAIL'
  if (
    [(connectionResults.httpsStatus, connectionResults.hstsStatus)].every((status) => status.toUpperCase() === 'PASS')
  )
    connectionResultsStatus = 'PASS'
  else if (
    [(connectionResults.httpsStatus, connectionResults.hstsStatus)].every((status) => status.toUpperCase() === 'INFO')
  )
    connectionResultsStatus = 'INFO'

  // eslint-disable-next-line react/prop-types
  const InfoTableItem = ({ label, icon, title, value, ...props }) => {
    return (
      <Flex align="center" py="0.5" px="2" _even={{ bg: 'gray.200' }} {...props}>
        <DetailTooltip label={label}>
          {icon}
          <Text px="1">{title}</Text>
        </DetailTooltip>
        <Text>{value}</Text>
      </Flex>
    )
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
              {[
                { label: <Trans>Status:</Trans>, value: statusCode },
                { label: '', value: blockedCategory },
                { label: '', value: HSTS },
              ].map(({ label, value }, i) =>
                value ? (
                  <Text key={i} pl="4">
                    {label} {value}
                  </Text>
                ) : null,
              )}
              <AccordionButton color="blue.500" variant="link">
                <PlusSquareIcon mr="1" />
                <Trans>See headers</Trans>
              </AccordionButton>
              <AccordionPanel>
                <Code>
                  {Object.keys(headers).map((key, idx) => (
                    <Text key={idx}>
                      {key}: {headers[key]}
                    </Text>
                  ))}
                </Code>
              </AccordionPanel>
            </Box>
          </AccordionItem>
        )
      }
    })

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
                {[
                  {
                    label: t`Shows if the HTTP connection is live.`,
                    icon: <StatusIcon status="INFO" />,
                    title: <Trans>HTTP Live</Trans>,
                    value: httpLive ? t`Yes` : t`No`,
                  },
                  {
                    label: t`Shows if the HTTP endpoint upgrades to HTTPS upgrade immediately, eventually (after the first redirect), or never.`,
                    icon: <StatusIcon status={!httpLive ? 'INFO' : httpImmediatelyUpgrades ? 'PASS' : 'FAIL'} />,
                    title: <Trans>HTTP Upgrades</Trans>,
                    value: !httpLive
                      ? t`Not available`
                      : httpImmediatelyUpgrades
                      ? t`Immediately`
                      : httpEventuallyUpgrades
                      ? t`Eventually`
                      : t`Never`,
                  },
                ].map((vals, idx) => (
                  <InfoTableItem {...vals} key={idx} />
                ))}
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
                {[
                  {
                    label: t`Shows if the HTTPS connection is live.`,
                    icon: <StatusIcon status={!isWebHosting ? 'INFO' : httpsLive ? 'PASS' : 'FAIL'} />,
                    title: <Trans>HTTPS Live</Trans>,
                    value: httpsLive ? t`Yes` : t`No`,
                  },
                  {
                    label: t`Shows if the HTTPS endpoint downgrades to unsecured HTTP immediately, eventually, or never.`,
                    icon: (
                      <StatusIcon
                        status={
                          !isWebHosting
                            ? 'INFO'
                            : httpsImmediatelyDowngrades || httpsEventuallyDowngrades
                            ? 'FAIL'
                            : 'PASS'
                        }
                      />
                    ),
                    title: <Trans>HTTPS Downgrades</Trans>,
                    value: httpsImmediatelyDowngrades
                      ? t`Immediately`
                      : httpsEventuallyDowngrades
                      ? t`Eventually`
                      : t`Never`,
                  },
                  {
                    label: t`Shows if the HSTS (HTTP Strict Transport Security) header is present.`,
                    icon: <StatusIcon status={!isWebHosting ? 'INFO' : hstsParsed ? 'PASS' : 'FAIL'} />,
                    title: <Trans>HSTS Parsed</Trans>,
                    value: hstsParsed ? t`Yes` : t`No`,
                  },
                  {
                    label: t`Shows the duration of time, in seconds, that the HSTS header is valid.`,
                    icon: <StatusIcon status="INFO" />,
                    title: <Trans>HSTS Max Age</Trans>,
                    value: hstsParsed?.maxAge || t`Not available`,
                  },
                  {
                    label: t`Shows if the HSTS header includes the preload directive.`,
                    icon: <StatusIcon status="INFO" />,
                    title: <Trans>HSTS Preloaded</Trans>,
                    value: !hstsParsed ? t`Not available` : hstsParsed?.preload ? t`Yes` : t`No`,
                  },
                  {
                    label: t`Shows if the HSTS header includes the includeSubdomains directive.`,
                    icon: <StatusIcon status="INFO" />,
                    title: <Trans>HSTS Includes Subdomains</Trans>,
                    value: !hstsParsed ? t`Not available` : hstsParsed?.includeSubdomains ? t`Yes` : t`No`,
                  },
                ].map((vals, idx) => (
                  <InfoTableItem {...vals} key={idx} />
                ))}
              </Box>
              <Text mt="2" fontWeight="bold" mx="2">
                <Trans>URL: </Trans> {httpsChainResult?.uri}
              </Text>
              <Accordion allowMultiple defaultIndex={[]}>
                {connChainResult(httpsChainResult)}
              </Accordion>
              <ABTestWrapper insiderVariantName="B">
                <ABTestVariant name="B">
                  <SecurityTxt data={httpsChainResult?.securityTxt} mx="2" />
                </ABTestVariant>
              </ABTestWrapper>
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
