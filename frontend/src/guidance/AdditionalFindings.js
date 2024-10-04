import React, { useState } from 'react'
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
  Link,
  SimpleGrid,
} from '@chakra-ui/react'
import { ExternalLinkIcon } from '@chakra-ui/icons'
import { Trans, t } from '@lingui/macro'
import { any, bool, string } from 'prop-types'
import { useLingui } from '@lingui/react'
import { useQuery } from '@apollo/client'
import { GUIDANCE_ADDITIONAL_FINDINGS } from '../graphql/queries'
import { LoadingMessage } from '../components/LoadingMessage'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import CveIgnorer from './CveIgnorer'
import IgnoredCves from './IgnoredCves'

export function AdditionalFindings({ domain, cveDetected }) {
  const { i18n } = useLingui()
  const vulnerabilitySeverities = { critical: t`Critical`, high: t`High`, medium: t`Medium`, low: t`Low` }
  const cveSeverityOnHover = { critical: 'red.100', high: 'orange.100', medium: 'yellow.50', low: 'gray.100' }
  const [activeCve, setActiveCve] = useState('')
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: cveIsOpen, onOpen: cveOnOpen, onClose: cveOnClose } = useDisclosure()

  const formatTimestamp = (datetime) => new Date(datetime).toLocaleDateString()

  const { data, loading, error } = useQuery(GUIDANCE_ADDITIONAL_FINDINGS, {
    variables: { domain },
  })

  if (loading) {
    return (
      <LoadingMessage>
        <Trans>Additional Findings</Trans>
      </LoadingMessage>
    )
  }

  if (error) {
    return <ErrorFallbackMessage error={error} />
  }

  if (!data.findDomainByDomain.additionalFindings) {
    return (
      <Box borderWidth="1px" borderColor="black" justifyContent="center" rounded="md">
        <Text fontSize="2xl" fontWeight="bold" textAlign="center" my="1">
          <Trans>No additional findings available at this time.</Trans>
        </Text>
      </Box>
    )
  }

  const { id: domainId, ignoredCves } = data.findDomainByDomain
  const { timestamp, headers, webComponents, vulnerabilities, ports } = data.findDomainByDomain.additionalFindings
  const frameworkComponents = webComponents.filter(({ webComponentCategory }) => webComponentCategory === 'Framework')
  const ddosProtectionComponent = webComponents.find(
    ({ webComponentCategory }) => webComponentCategory === 'DDOS Protection',
  )
  const cdnComponent = webComponents.find(({ webComponentCategory }) => webComponentCategory === 'CDN')
  const sortedPorts = ports.slice().sort((a, b) => Number(a.port) - Number(b.port))
  const otherComponents = webComponents.filter(
    ({ webComponentCategory }) => !['Framework', 'DDOS Protection', 'CDN'].includes(webComponentCategory),
  )

  const setActiveCveHandler = (cve) => {
    setActiveCve({
      cve,
      affectedWebComps: webComponents.filter(({ webComponentCves }) => webComponentCves.some((x) => x.cve === cve)),
    })
    cveOnOpen()
  }

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
        <Accordion allowMultiple defaultIndex={[0, 1, 2, 3, 4, 5, 6]} w="100%">
          <AccordionItem>
            <Flex as={AccordionButton}>
              <Text fontSize="xl" ml="2" id="vulnerabilities">
                <Trans>SPIN Top 25 Vulnerabilities</Trans>
              </Text>
              <AccordionIcon boxSize="icons.xl" />
            </Flex>
            <AccordionPanel pb={4}>
              <Link
                colour="blue.500"
                href={
                  i18n.locale === 'en'
                    ? 'https://www.canada.ca/en/government/system/digital-government/policies-standards/spin/improving-gc-cyber-security-health.html'
                    : 'https://www.canada.ca/fr/gouvernement/systeme/gouvernement-numerique/politiques-normes/amops/renforcement-cybersecurite-gouvernement-canada.html'
                }
                isExternal
              >
                <Trans>Improving GC Cyber Security Health SPIN</Trans> <ExternalLinkIcon />
              </Link>
              {cveDetected ? (
                Object.keys(vulnerabilitySeverities).map((severity) => {
                  return (
                    vulnerabilities[severity].length > 0 && (
                      <Box key={severity} px="2" mb="2">
                        <Text>
                          <b>{vulnerabilitySeverities[severity]}</b>
                        </Text>
                        <SimpleGrid columns={8}>
                          {vulnerabilities[severity].map(({ cve }) => {
                            return (
                              <Button
                                key={cve}
                                borderRadius="full"
                                m="1"
                                borderColor="black"
                                borderWidth="1px"
                                bg={severity}
                                fontWeight="normal"
                                size="sm"
                                _hover={{ bg: cveSeverityOnHover[severity] }}
                                onClick={() => {
                                  setActiveCveHandler(cve)
                                }}
                              >
                                {cve}
                              </Button>
                            )
                          })}
                        </SimpleGrid>
                      </Box>
                    )
                  )
                })
              ) : (
                <Text fontWeight="bold" fontSize="xl">
                  <Trans>No Top 25 Vulnerabilites Detected</Trans>
                </Text>
              )}
              <IgnoredCves ignoredCves={ignoredCves} setActiveCveHandler={setActiveCveHandler} />
            </AccordionPanel>
          </AccordionItem>

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
              {frameworkComponents.length > 0 ? (
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
                <Trans>
                  3.1.3 Use GC-approved content delivery networks (CDN) that cache websites and protects access to the
                  origin server.
                </Trans>
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
                <Trans>Web Components</Trans>
              </Text>
              <AccordionIcon boxSize="icons.xl" />
            </Flex>
            <AccordionPanel pb={4}>
              {otherComponents.length > 0 ? (
                otherComponents.map(
                  ({
                    webComponentName,
                    webComponentCategory,
                    webComponentVersion,
                    webComponentFirstSeen,
                    webComponentLastSeen,
                  }) => {
                    return (
                      <Box key={`${webComponentName}-${webComponentVersion}`}>
                        <Flex justify="space-between" px="2">
                          {webComponentVersion ? (
                            <Text minW="50%">
                              {webComponentName} {webComponentCategory} ({webComponentVersion})
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
                  <Trans>No additional web components found</Trans>
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
                const lastPortStateTranslated =
                  lastPortState.toUpperCase() === 'OPEN'
                    ? t`Open`
                    : lastPortState.toUpperCase() === 'FILTERED'
                    ? t`Filtered`
                    : lastPortState
                return (
                  <Box key={port}>
                    <Flex justify="flex-start" px="2">
                      <Text minW="25%">{port}</Text>
                      <Text minW="25%">
                        <Trans>State: {lastPortStateTranslated}</Trans>
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
        </Accordion>
      </Box>

      <Modal isOpen={cveIsOpen} onClose={cveOnClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{activeCve?.cve}</ModalHeader>
          <ModalCloseButton />
          <ModalBody fontSize="lg">
            <Trans>Affected Components:</Trans>
            {activeCve?.affectedWebComps?.map(({ webComponentName, webComponentCategory, webComponentVersion }) => (
              <Text key={webComponentName} ml="2">
                {webComponentName} {webComponentCategory} {webComponentVersion}
              </Text>
            ))}
            <CveIgnorer cve={activeCve?.cve} isCveIgnored={ignoredCves?.includes(activeCve?.cve)} domainId={domainId} />
          </ModalBody>
          <ModalFooter>
            <Link color="blue.500" href={`https://www.cve.org/CVERecord?id=${activeCve?.cve}`} isExternal>
              <Trans>More info</Trans> <ExternalLinkIcon />
            </Link>
          </ModalFooter>
        </ModalContent>
      </Modal>

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
              tool. Updates to these findings occur daily.
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
  domain: string.isRequired,
  cveDetected: bool,
}

WebRequirementsLink.propTypes = {
  children: any.isRequired,
}
