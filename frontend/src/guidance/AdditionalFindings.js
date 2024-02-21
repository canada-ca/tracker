import {
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Box,
  Text,
  Flex,
} from '@chakra-ui/react'
import { Trans } from '@lingui/macro'
import { object } from 'prop-types'
import React from 'react'

export function AdditionalFindings({ data }) {
  const { timestamp, headers, locations, ports, webComponents } = data

  const ddosProtectionComponent = webComponents.find(
    ({ webComponentCategory }) => webComponentCategory === 'DDOS Protection',
  )

  const cdnComponent = webComponents.find(({ webComponentCategory }) => webComponentCategory === 'CDN')

  const vulnerabilities = webComponents.filter(({ webComponentCves }) => webComponentCves.length > 0)

  return (
    <Box>
      <Text>
        <Trans>Last Scanned: {timestamp}</Trans>
      </Text>

      <Accordion>
        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box as="span" flex="1" textAlign="left">
                Ports
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            {ports.map(({ port, lastPortState, portStateFirstSeen, portStateLastSeen }) => {
              return (
                <Flex key={port} justify="space-around">
                  <Text>{port}</Text>
                  <Text>{lastPortState}</Text>
                  <Text>First Seen: {portStateFirstSeen}</Text>
                  <Text>Last Seen: {portStateLastSeen}</Text>
                </Flex>
              )
            })}
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box as="span" flex="1" textAlign="left">
                DDOS Protection
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            {ddosProtectionComponent ? (
              <Flex justify="space-around">
                <Text>{ddosProtectionComponent.webComponentName}</Text>
                <Text>{ddosProtectionComponent.webComponentVersion}</Text>
                <Text>{ddosProtectionComponent.webComponentFirstSeen}</Text>
                <Text>{ddosProtectionComponent.webComponentLastSeen}</Text>
              </Flex>
            ) : (
              <Text>No DDOS Protection found</Text>
            )}
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box as="span" flex="1" textAlign="left">
                CDN
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            {cdnComponent ? (
              <Flex justify="space-around">
                <Text>{cdnComponent.webComponentName}</Text>
                <Text>{cdnComponent.webComponentVersion}</Text>
                <Text>{cdnComponent.webComponentFirstSeen}</Text>
                <Text>{cdnComponent.webComponentLastSeen}</Text>
              </Flex>
            ) : (
              <Text>No CDN found</Text>
            )}
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box as="span" flex="1" textAlign="left">
                Vulnerabilities
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            {vulnerabilities.length > 0 ? (
              vulnerabilities.map(({ webComponentName, webComponentCves }) => {
                return (
                  <Flex key={webComponentName} justify="space-around">
                    <Text>{webComponentName}</Text>
                    <Text>{webComponentCves.length}</Text>
                  </Flex>
                )
              })
            ) : (
              <Text>No vulnerabilities found</Text>
            )}
          </AccordionPanel>
        </AccordionItem>
      </Accordion>

      {/* {JSON.stringify(data, null, 2)} */}
    </Box>
  )
}

AdditionalFindings.propTypes = {
  data: object.isRequired,
}
