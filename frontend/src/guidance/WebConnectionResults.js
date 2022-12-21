import React from 'react'
import { NumberedStatusIcon } from '../components/NumberedStatusIcon'
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
import { object } from 'prop-types'
import { PlusSquareIcon } from '@chakra-ui/icons'
import { StatusIcon } from '../components/StatusIcon'
import { GuidanceTagList } from './GuidanceTagList'
import { Trans, t } from '@lingui/macro'

export function WebConnectionResults({ connectionResults }) {
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
    mb: '1',
    px: '2',
  }

  const connChainResult = (chainResult) =>
    chainResult.connections.map(({ uri, connection, error }, idx) => {
      if (error) {
        return (
          <Box px="2" m="2" borderWidth="1px" bg="gray.100" borderColor="gray.300">
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

  return (
    <AccordionItem>
      <Flex as={AccordionButton}>
        {connectionResults.negativeTags.length > 0 ? (
          <NumberedStatusIcon number={connectionResults.negativeTags.length} status="FAIL" />
        ) : (
          <StatusIcon status="PASS" boxSize="icons.lg" />
        )}
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
                  <StatusIcon status="INFO" />
                  <Text px="1" minW="50%">
                    <Trans>HTTP Live</Trans>
                  </Text>
                  <Text>{httpLive ? t`Yes` : t`No`}</Text>
                </Flex>
                <Flex {...columnInfoStyleProps} bg="gray.200">
                  <StatusIcon status={httpImmediatelyUpgrades ? 'PASS' : 'FAIL'} />
                  <Text px="1" minW="50%">
                    <Trans>HTTP Upgrades</Trans>
                  </Text>
                  <Text>
                    {httpImmediatelyUpgrades ? t`Immediately` : httpEventuallyUpgrades ? t`Eventually` : t`Never`}
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
                  <StatusIcon status={httpsLive ? 'PASS' : 'FAIL'} />
                  <Text px="1" minW="50%">
                    <Trans>HTTPS Live</Trans>
                  </Text>
                  <Text>{httpsLive ? t`Yes` : t`No`}</Text>
                </Flex>
                <Flex {...columnInfoStyleProps} bg="gray.200">
                  <StatusIcon status={httpsImmediatelyDowngrades || httpsEventuallyDowngrades ? 'FAIL' : 'PASS'} />
                  <Text px="1" minW="50%">
                    <Trans>HTTPS Downgrades</Trans>
                  </Text>
                  <Text>
                    {httpsImmediatelyDowngrades ? t`Immediately` : httpsEventuallyDowngrades ? t`Eventually` : t`Never`}
                  </Text>
                </Flex>
                <Flex {...columnInfoStyleProps}>
                  <StatusIcon status={hstsParsed ? 'PASS' : 'FAIL'} />
                  <Text px="1" minW="50%">
                    <Trans>HSTS Parsed</Trans>
                  </Text>
                  <Text>{hstsParsed ? t`Yes` : t`No`}</Text>
                </Flex>
                <Flex {...columnInfoStyleProps} bg="gray.200">
                  <StatusIcon status="INFO" />
                  <Text px="1" minW="50%">
                    <Trans>HSTS Max Age</Trans>
                  </Text>
                  <Text>{hstsParsed.maxAge}</Text>
                </Flex>
                <Flex {...columnInfoStyleProps}>
                  <StatusIcon status="INFO" />
                  <Text px="1" minW="50%">
                    <Trans>HSTS Preloaded</Trans>
                  </Text>
                  <Text>{hstsParsed.preload ? t`Yes` : t`No`}</Text>
                </Flex>
                <Flex {...columnInfoStyleProps} bg="gray.200">
                  <StatusIcon status="INFO" />
                  <Text px="1" minW="50%">
                    <Trans>HSTS Includes Subdomains</Trans>
                  </Text>
                  <Text>{hstsParsed.includeSubdomains ? t`Yes` : t`No`}</Text>
                </Flex>
              </Box>
              <Text mt="2" fontWeight="bold" mx="2">
                <Trans>URL: </Trans> {httpsChainResult.uri}
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
}
