import React from 'react'
import {
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Box,
  Text,
  Flex,
  Divider,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Tag,
  Link,
  SimpleGrid,
} from '@chakra-ui/react'
import { ExternalLinkIcon } from '@chakra-ui/icons'
import { Trans, t } from '@lingui/macro'
import { any, object } from 'prop-types'
import { useLingui } from '@lingui/react'

export function AdditionalFindings({ data }) {
  const vulnerabilitySeverities = { critical: t`Critical`, high: t`High`, medium: t`Medium`, low: t`Low` }
  const { isOpen, onOpen, onClose } = useDisclosure()
  const formatTimestamp = (datetime) => new Date(datetime).toLocaleDateString()

  const { timestamp, headers, webComponents, vulnerabilities, ports } = data
  const frameworkComponents = webComponents.filter(({ webComponentCategory }) => webComponentCategory === 'Framework')
  const ddosProtectionComponent = webComponents.find(
    ({ webComponentCategory }) => webComponentCategory === 'DDOS Protection',
  )
  const cdnComponent = webComponents.find(({ webComponentCategory }) => webComponentCategory === 'CDN')
  const sortedPorts = ports.slice().sort((a, b) => Number(a.port) - Number(b.port))

  return (
    <>
      <Box>
        <Text fontSize="lg">
          <Trans>
            <b>Last Scanned:</b> {formatTimestamp(timestamp)}
          </Trans>
        </Text>

        <Button variant="link" my="4" onClick={onOpen} fontSize="lg">
          <Trans>What are these additional findings?</Trans>
        </Button>
        <Accordion allowMultiple defaultIndex={[0, 1, 2, 3, 4, 5]} w="100%">
          <AccordionItem>
            <Flex as={AccordionButton}>
              <Text fontSize="xl" ml="2">
                <Trans>Frameworks</Trans>
              </Text>
              <AccordionIcon boxSize="icons.xl" />
            </Flex>
            <AccordionPanel pb={4}>
              <WebRequirementsLink>
                <Trans>
                  2.1 Robust web application frameworks are used to aid in developing secure web applications.
                </Trans>
              </WebRequirementsLink>
              <Divider borderBottomColor="gray.900" />
              {frameworkComponents ? (
                frameworkComponents.map(
                  ({ webComponentName, webComponentVersion, webComponentFirstSeen, webComponentLastSeen }) => {
                    return (
                      <Box key={`${webComponentName}-${webComponentVersion}`}>
                        <Flex justify="space-between" px="2">
                          {webComponentVersion ? (
                            <Text minW="50%">
                              {webComponentName} ({webComponentVersion})
                            </Text>
                          ) : (
                            <Text minW="50%">{webComponentName}</Text>
                          )}
                          <Text minW="25%">
                            <Trans>First Seen: {formatTimestamp(webComponentFirstSeen)}</Trans>
                          </Text>
                          <Text minW="25%">
                            <Trans>Last Seen: {formatTimestamp(webComponentLastSeen)}</Trans>
                          </Text>
                        </Flex>
                        <Divider borderBottomColor="gray.900" />
                      </Box>
                    )
                  },
                )
              ) : (
                <Text>
                  <Trans>No frameworks found</Trans>
                </Text>
              )}
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem>
            <Flex as={AccordionButton}>
              <Text fontSize="xl" ml="2">
                <Trans>Response Headers</Trans>
              </Text>
              <AccordionIcon boxSize="icons.xl" />
            </Flex>
            <AccordionPanel pb={4}>
              <WebRequirementsLink>
                <Trans>
                  2.4 Web applications implement Content-Security-Policy, HSTS and X-Frame-Options response headers.
                </Trans>
              </WebRequirementsLink>
              <Divider borderBottomColor="gray.900" />
              {headers?.length > 0 ? (
                <Flex justify="space-around" px="2">
                  {headers.map((header) => {
                    return <Text key={header}>{header}</Text>
                  })}
                </Flex>
              ) : (
                <Text px="2">
                  <Trans>No response headers found</Trans>
                </Text>
              )}
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem>
            <Flex as={AccordionButton}>
              <Text fontSize="xl" ml="2">
                <Trans>DDOS Protection</Trans>
              </Text>
              <AccordionIcon boxSize="icons.xl" />
            </Flex>
            <AccordionPanel pb={4}>
              <WebRequirementsLink>
                <Trans>3.1.2 Use a denial-of-service mitigation service</Trans>
              </WebRequirementsLink>
              <Divider borderBottomColor="gray.900" />
              {ddosProtectionComponent ? (
                <Flex justify="space-around" px="2">
                  <Text>{ddosProtectionComponent.webComponentName}</Text>
                  <Text>{ddosProtectionComponent.webComponentVersion}</Text>
                  <Text>
                    <Trans>First Seen: {formatTimestamp(ddosProtectionComponent.webComponentFirstSeen)}</Trans>
                  </Text>
                  <Text>
                    <Trans>Last Seen: {formatTimestamp(ddosProtectionComponent.webComponentLastSeen)}</Trans>
                  </Text>
                </Flex>
              ) : (
                <Text px="2">
                  <Trans>No DDOS Protection found</Trans>
                </Text>
              )}
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem>
            <Flex as={AccordionButton}>
              <Text fontSize="xl" ml="2">
                <Trans>Content Delivery Network</Trans>
              </Text>
              <AccordionIcon boxSize="icons.xl" />
            </Flex>
            <AccordionPanel pb={4}>
              <WebRequirementsLink>
                3.1.3 Use GC-approved content delivery networks (CDN) that cache websites and protects access to the
                origin server.
              </WebRequirementsLink>
              <Divider borderBottomColor="gray.900" />
              {cdnComponent ? (
                <Flex px="2">
                  <Text minW="50%">{cdnComponent.webComponentName}</Text>
                  <Text minW="25%">
                    <Trans>First Seen: {formatTimestamp(cdnComponent.webComponentFirstSeen)}</Trans>
                  </Text>
                  <Text minW="25%">
                    <Trans>Last Seen: {formatTimestamp(cdnComponent.webComponentLastSeen)}</Trans>
                  </Text>
                </Flex>
              ) : (
                <Text>
                  <Trans>No CDN found</Trans>
                </Text>
              )}
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem>
            <Flex as={AccordionButton}>
              <Text fontSize="xl" ml="2">
                <Trans>Ports</Trans>
              </Text>
              <AccordionIcon boxSize="icons.xl" />
            </Flex>
            <AccordionPanel pb={4}>
              {sortedPorts.map(({ port, lastPortState, portStateFirstSeen, portStateLastSeen }) => {
                return (
                  <Box key={port}>
                    <Flex justify="flex-start" px="2">
                      <Text minW="25%">{port}</Text>
                      <Text minW="25%">
                        <Trans>State: {lastPortState}</Trans>
                      </Text>
                      <Text minW="25%">
                        <Trans>First Seen: {formatTimestamp(portStateFirstSeen)}</Trans>
                      </Text>
                      <Text minW="25%">
                        <Trans>Last Seen: {formatTimestamp(portStateLastSeen)}</Trans>
                      </Text>
                    </Flex>
                    <Divider borderBottomColor="gray.900" />
                  </Box>
                )
              })}
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem>
            <Flex as={AccordionButton}>
              <Text fontSize="xl" ml="2">
                <Trans>Vulnerabilities</Trans>
              </Text>
              <AccordionIcon boxSize="icons.xl" />
            </Flex>
            <AccordionPanel pb={4}>
              {Object.keys(vulnerabilitySeverities).map((severity) => {
                return (
                  <Box key={severity} px="2" mb="2">
                    <Text>
                      <b>{vulnerabilitySeverities[severity]}</b>
                    </Text>
                    <SimpleGrid columns={8} textAlign="center">
                      {vulnerabilities[severity].map(({ cve }) => {
                        return (
                          <Tag key={cve} bg={severity} borderColor="black" borderWidth="1px" m="1">
                            <Link href={`https://www.cve.org/CVERecord?id=${cve}`} isExternal>
                              <Text>{cve}</Text>
                            </Link>
                          </Tag>
                        )
                      })}
                    </SimpleGrid>
                  </Box>
                )
              })}
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Trans>Additional Findings</Trans>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody fontSize="lg">
            <Trans>
              These findings are imported from Microsoft's{' '}
              <Link
                color="blue.500"
                isExternal
                href="https://learn.microsoft.com/en-us/azure/external-attack-surface-management/"
              >
                External Attack Surface Management
              </Link>{' '}
              tool. Updates to these findings occur weekly.
            </Trans>
          </ModalBody>
          <ModalFooter />
        </ModalContent>
      </Modal>
    </>
  )
}

function WebRequirementsLink({ children }) {
  const { i18n } = useLingui()
  return (
    <Link
      isExternal
      href={
        i18n.locale === 'en'
          ? 'https://www.canada.ca/en/government/system/digital-government/policies-standards/enterprise-it-service-common-configurations/web-sites.html'
          : 'https://www.canada.ca/fr/gouvernement/systeme/gouvernement-numerique/politiques-normes/configurations-courantes-services-ti-integree/sites-web.html'
      }
    >
      {children} <ExternalLinkIcon />
    </Link>
  )
}

AdditionalFindings.propTypes = {
  data: object.isRequired,
}

WebRequirementsLink.propTypes = {
  children: any.isRequired,
}
