import React, { useState } from 'react'
import { ArrowLeftIcon, ArrowUpIcon, PlusSquareIcon } from '@chakra-ui/icons'
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Code,
  Flex,
  Heading,
  IconButton,
  ListItem,
  OrderedList,
  Select,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from '@chakra-ui/react'
import { t, Trans } from '@lingui/macro'

import { ScanDomainButton } from '../domains/ScanDomainButton'
import { Link as RouteLink } from 'react-router-dom'
import { GuidanceTagList } from '../guidance/GuidanceTagList'
import { StatusIcon } from '../components/StatusIcon'
import { NumberedStatusIcon } from '../components/NumberedStatusIcon'
import { StatusBadge } from '../domains/StatusBadge'
const { data } = require('./new_scan_results.json')

function NewGuidancePage() {
  const {
    domain: domainName,
    web: webScan,
    dnsScan,
    status,
    dmarcPhase,
  } = data.findDomainByDomain

  const { results: webResults } = webScan.edges[0].node
  const { node: dnsResults } = dnsScan.edges[0]
  const [selectedEndpoint, setSelectedEndpoint] = useState(
    webResults[0].ipAddress,
  )

  const weakProtocolNames = {
    'ssl2-0CipherSuites': 'SSL 2.0',
    'ssl3-0CipherSuites': 'SSL 3.0',
    'tls1-0CipherSuites': 'TLS 1.0',
    'tls1-1CipherSuites': 'TLS 1.1',
  }

  let totalWebPass = 0
  let totalWebInfo = 0
  let totalWebFail = 0

  const endPointSummary = (
    <Accordion allowMultiple defaultIndex={[0]}>
      <AccordionItem>
        <Flex align="center" as={AccordionButton}>
          <Text fontSize="2xl">Endpoint Summary</Text>
          <Flex
            py="1"
            px="2"
            align="center"
            borderWidth="2px"
            bg="gray.100"
            borderColor="gray.300"
            rounded="md"
            ml="auto"
          >
            <NumberedStatusIcon number={4} status="FAIL" />
            <Text px="1" fontWeight="bold" color="weak">
              Negative
            </Text>
          </Flex>
          <Flex
            py="1"
            px="2"
            align="center"
            borderWidth="2px"
            bg="gray.100"
            borderColor="gray.300"
            rounded="md"
            mx="1"
          >
            <NumberedStatusIcon number={1} status="INFO" />
            <Text px="1" fontWeight="bold" color="info">
              Informative
            </Text>
          </Flex>
          <Flex
            py="1"
            px="2"
            align="center"
            borderWidth="2px"
            bg="gray.100"
            borderColor="gray.300"
            rounded="md"
            mr="1"
          >
            <NumberedStatusIcon number={3} status="PASS" />
            <Text px="1" fontWeight="bold" color="strong">
              Positive
            </Text>
          </Flex>
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

            totalWebPass += endpointPass
            totalWebInfo += endpointInfo
            totalWebFail += endpointFail

            return (
              <Flex key={idx} align="center" py="1">
                <Text fontSize="xl" pr="2">
                  {ipAddress}
                </Text>
                <Flex
                  py="1"
                  px="2"
                  align="center"
                  borderWidth="2px"
                  bg="gray.100"
                  borderColor="gray.300"
                  rounded="md"
                  ml="auto"
                >
                  <NumberedStatusIcon number={endpointFail} status="FAIL" />
                  <Text px="1" fontWeight="bold" color="weak">
                    Negative
                  </Text>
                </Flex>
                <Flex
                  py="1"
                  px="2"
                  align="center"
                  borderWidth="2px"
                  bg="gray.100"
                  borderColor="gray.300"
                  rounded="md"
                  mx="1"
                >
                  <NumberedStatusIcon number={endpointInfo} status="INFO" />
                  <Text px="1" fontWeight="bold" color="info">
                    Informative
                  </Text>
                </Flex>
                <Flex
                  py="1"
                  px="2"
                  align="center"
                  borderWidth="2px"
                  bg="gray.100"
                  borderColor="gray.300"
                  rounded="md"
                  mr="2.25rem"
                >
                  <NumberedStatusIcon number={endpointPass} status="PASS" />
                  <Text px="1" fontWeight="bold" color="strong">
                    Positive
                  </Text>
                </Flex>
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
        Endpoint:
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

  const {
    'tls1-2CipherSuites': tls1_2,
    'tls1-3CipherSuites': tls1_3,
    ...rest
  } = tlsResult.acceptedCipherSuites

  const weakProtocols = Object.keys(rest).filter((protocol) => {
    return rest[protocol].length > 0
  })

  const tlsProtocols = (
    <Box>
      <Flex as={AccordionButton}>
        <StatusIcon status="PASS" />
        <Text mx="2" fontSize="xl">
          Protocols
        </Text>
        <AccordionIcon />
      </Flex>
      <AccordionPanel>
        {weakProtocols.length > 0 ? (
          weakProtocols.map((protocol) => {
            return (
              <>
                <Text fontSize="xl" fontWeight="bold" as="u">
                  {weakProtocolNames[protocol]}
                </Text>
                {rest[protocol].map(({ name }, idx) => {
                  return (
                    <Text key={idx} color="weak" fontWeight="bold">
                      {name}
                    </Text>
                  )
                })}
              </>
            )
          })
        ) : (
          <Box bg="strongMuted">
            <Text px="2" py="1">
              No known weak protocols used.
            </Text>
          </Box>
        )}
      </AccordionPanel>
    </Box>
  )

  const tlsCiphers = (
    <Box>
      <Flex as={AccordionButton}>
        <StatusIcon status="FAIL" />
        <Text mx="2" fontSize="xl">
          Ciphers
        </Text>
        <AccordionIcon />
      </Flex>
      <AccordionPanel>
        <>
          {tls1_2.length > 0 && (
            <>
              <Text fontSize="xl" fontWeight="bold" as="u">
                TLS 1.2
              </Text>

              <Flex>
                <Box>
                  {tls1_2.map(({ name, strength }, idx) => {
                    return (
                      <Text key={idx} fontWeight="bold" color={strength}>
                        {name}
                      </Text>
                    )
                  })}
                </Box>
                <Box ml="2rem">
                  {tls1_2.map(({ strength }, idx) => {
                    return (
                      <Text key={idx} fontWeight="bold" color={strength}>
                        {strength.toUpperCase()}
                      </Text>
                    )
                  })}
                </Box>
              </Flex>
            </>
          )}
          {tls1_3.length > 0 && (
            <>
              <Text fontSize="xl" as="u" fontWeight="bold">
                TLS 1.3
              </Text>
              <Flex>
                <Box>
                  {tls1_3.map(({ name, strength }, idx) => {
                    return (
                      <Text key={idx} fontWeight="bold" color={strength}>
                        {name}
                      </Text>
                    )
                  })}
                </Box>
                <Box ml="2rem">
                  {tls1_3.map(({ strength }, idx) => {
                    return (
                      <Text key={idx} fontWeight="bold" color={strength}>
                        {strength.toUpperCase()}
                      </Text>
                    )
                  })}
                </Box>
              </Flex>
            </>
          )}
        </>
      </AccordionPanel>
    </Box>
  )

  const tlsCurves = (
    <Box>
      <Flex as={AccordionButton}>
        <StatusIcon status="PASS" />
        <Text mx="2" fontSize="xl">
          Curves
        </Text>
        <AccordionIcon />
      </Flex>
      <AccordionPanel>
        <Flex>
          <Box>
            {tlsResult.acceptedEllipticCurves.map(({ name, strength }, idx) => {
              return (
                <Text key={idx} fontWeight="bold" color={strength}>
                  {name}
                </Text>
              )
            })}
          </Box>
          <Box ml="2rem">
            {tlsResult.acceptedEllipticCurves.map(({ strength }, idx) => {
              return (
                <Text key={idx} fontWeight="bold" color={strength}>
                  {strength.toUpperCase()}
                </Text>
              )
            })}
          </Box>
        </Flex>
      </AccordionPanel>
    </Box>
  )

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

  const connectionGuidance = (
    <Accordion
      allowMultiple
      defaultIndex={connectionResults.negativeTags.length > 0 ? [0] : []}
    >
      <AccordionItem>
        <Flex as={AccordionButton}>
          {connectionResults.negativeTags.length > 0 ? (
            <NumberedStatusIcon
              number={connectionResults.negativeTags.length}
              status="FAIL"
            />
          ) : (
            <StatusIcon status="PASS" boxSize="icons.lg" />
          )}
          <Text fontSize="2xl" ml="2">
            Connection Results
          </Text>{' '}
          <AccordionIcon boxSize="icons.xl" />
        </Flex>
        <AccordionPanel>
          <Flex mb="2">
            <StatusBadge text="HTTPS" status={status.https} />
            <StatusBadge text="HSTS" status={status.hsts} />
          </Flex>
          <GuidanceTagList
            positiveTags={connectionResults.positiveTags}
            neutralTags={connectionResults.neutralTags}
            negativeTags={connectionResults.negativeTags}
          />
          <Accordion allowMultiple defaultIndex={[]}>
            <AccordionItem>
              <Flex as={AccordionButton}>
                <Text fontSize="xl">HTTP (80)</Text>{' '}
                <AccordionIcon boxSize="icons.lg" />
              </Flex>
              <AccordionPanel>
                <Box maxW="50%" fontSize="lg">
                  <Flex align="center">
                    <StatusIcon status="INFO" />
                    <Text px="1">HTTP Live</Text>
                    <Text ml="auto">{httpLive ? 'Yes' : 'No'}</Text>
                  </Flex>
                  <Flex align="center">
                    <StatusIcon
                      status={httpImmediatelyUpgrades ? 'PASS' : 'FAIL'}
                    />
                    <Text px="1">HTTP Upgrades</Text>
                    <Text ml="auto">
                      {httpImmediatelyUpgrades
                        ? 'Immediately'
                        : httpEventuallyUpgrades
                        ? 'Eventually'
                        : 'Never'}
                    </Text>
                  </Flex>
                  {hstsParsed && (
                    <Flex align="center">
                      <StatusIcon status="INFO" />
                      <Text px="1">HSTS Parsed</Text>
                      <Text ml="auto">{hstsParsed ? 'Yes' : 'No'}</Text>
                    </Flex>
                  )}
                </Box>
                <Text mt="2" fontWeight="bold">
                  URL: {httpChainResult.uri}
                </Text>
                {httpChainResult.connections.map(
                  ({ uri, connection, error }, idx) => {
                    const { statusCode, headers, blockedCategory, HSTS } =
                      connection
                    return (
                      <Box
                        key={idx}
                        px="2"
                        my="2"
                        borderWidth="1px"
                        bg="gray.100"
                        borderColor="gray.300"
                      >
                        <Text>
                          {idx + 1}. {uri}
                        </Text>
                        {error ? (
                          <Text>{error}</Text>
                        ) : (
                          <>
                            <Text>Status: {statusCode}</Text>
                            <Text>{blockedCategory}</Text>
                            <Text>{HSTS}</Text>
                            <Code>
                              {Object.keys(headers).map((key, idx) => {
                                return (
                                  <Text key={idx}>
                                    {key}: {headers[key]}
                                  </Text>
                                )
                              })}
                            </Code>
                          </>
                        )}
                      </Box>
                    )
                  },
                )}
              </AccordionPanel>
            </AccordionItem>
            <AccordionItem>
              <Flex as={AccordionButton}>
                <Text fontSize="xl">HTTPS (443)</Text>{' '}
                <AccordionIcon boxSize="icons.lg" />
              </Flex>
              <AccordionPanel>
                <Box maxW="50%" fontSize="lg">
                  <Flex align="center">
                    <StatusIcon status={httpsLive ? 'PASS' : 'FAIL'} />
                    <Text px="1">HTTPS Live</Text>
                    <Text ml="auto">{httpsLive ? 'Yes' : 'No'}</Text>
                  </Flex>
                  <Flex align="center">
                    <StatusIcon
                      status={
                        httpsImmediatelyDowngrades || httpsEventuallyDowngrades
                          ? 'FAIL'
                          : 'PASS'
                      }
                    />
                    <Text px="1">HTTPS Downgrades</Text>
                    <Text ml="auto">
                      {httpsImmediatelyDowngrades
                        ? 'Immediately'
                        : httpsEventuallyDowngrades
                        ? 'Eventually'
                        : 'Never'}
                    </Text>
                  </Flex>
                  {hstsParsed && (
                    <Flex align="center">
                      <StatusIcon status="INFO" />
                      <Text px="1">HSTS Parsed</Text>
                      <Text ml="auto">{hstsParsed ? 'Yes' : 'No'}</Text>
                    </Flex>
                  )}
                </Box>
                <Text mt="2" fontWeight="bold">
                  URL: {httpsChainResult.uri}
                </Text>
                {httpsChainResult.connections.map(
                  ({ uri, connection, error }, idx) => {
                    const { statusCode, headers, blockedCategory, HSTS } =
                      connection
                    return (
                      <Box
                        key={idx}
                        px="2"
                        my="2"
                        borderWidth="1px"
                        bg="gray.100"
                        borderColor="gray.300"
                      >
                        <Text>
                          {idx + 1}. {uri}
                        </Text>
                        {error ? (
                          <Text>{error}</Text>
                        ) : (
                          <>
                            <Text>Status: {statusCode}</Text>
                            <Text>{blockedCategory}</Text>
                            <Text>{HSTS}</Text>
                            <Code>
                              {Object.keys(headers).map((key, idx) => {
                                return (
                                  <Text key={idx}>
                                    {key}: {headers[key]}
                                  </Text>
                                )
                              })}
                            </Code>
                          </>
                        )}
                      </Box>
                    )
                  },
                )}
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  )

  const {
    badHostname,
    mustHaveStaple,
    leafCertificateIsEv,
    receivedChainContainsAnchorCertificate,
    receivedChainHasValidOrder,
    verifiedChainHasSha1Signature,
    verifiedChainHasLegacySymantecAnchor,
    certificateInfoChain,
  } = tlsResult.certificateChainInfo

  const tlsGuidance = (
    <Box py="2">
      <Accordion allowMultiple defaultIndex={[0]}>
        <AccordionItem>
          <Flex as={AccordionButton}>
            {tlsResult.negativeTags.length > 0 ? (
              <NumberedStatusIcon
                number={tlsResult.negativeTags.length}
                status="FAIL"
              />
            ) : (
              <StatusIcon status="PASS" />
            )}
            <Text fontSize="2xl" ml="2">
              TLS Results
            </Text>{' '}
            <AccordionIcon boxSize="icons.xl" />
          </Flex>
          <AccordionPanel>
            <Flex mb="2">
              <StatusBadge text="Protocols" status={status.protocols} />
              <StatusBadge text="Ciphers" status={status.ciphers} />
              <StatusBadge text="Curves" status={status.curves} />
            </Flex>
            <GuidanceTagList
              positiveTags={tlsResult.positiveTags}
              neutralTags={tlsResult.neutralTags}
              negativeTags={tlsResult.negativeTags}
            />

            <Accordion allowMultiple defaultIndex={[3]}>
              <AccordionItem>{tlsProtocols}</AccordionItem>
              <AccordionItem>{tlsCiphers}</AccordionItem>
              <AccordionItem>{tlsCurves}</AccordionItem>

              <AccordionItem>
                <Flex as={AccordionButton}>
                  <Text fontSize="xl">Certificate Chain</Text>
                  <AccordionIcon boxSize="icons.xl" />
                </Flex>
                <AccordionPanel>
                  <Box maxW="50%" fontSize="lg">
                    <Flex align="center">
                      <StatusIcon status={badHostname ? 'FAIL' : 'PASS'} />
                      <Text px="1">Good Hostname</Text>
                      <Text ml="auto">{badHostname ? 'No' : 'Yes'}</Text>
                    </Flex>
                    <Flex align="center">
                      <StatusIcon status="INFO" />
                      <Text px="1">Must Staple</Text>
                      <Text ml="auto">{mustHaveStaple ? 'Yes' : 'No'}</Text>
                    </Flex>
                    <Flex align="center">
                      <StatusIcon
                        status={leafCertificateIsEv ? 'PASS' : 'INFO'}
                      />
                      <Text px="1">Leaf Certificate is EV</Text>
                      <Text ml="auto">
                        {leafCertificateIsEv ? 'Yes' : 'No'}
                      </Text>
                    </Flex>
                    <Flex align="center">
                      <StatusIcon status="INFO" />
                      <Text px="1">
                        Received Chain Contains Anchor Certificate
                      </Text>
                      <Text ml="auto">
                        {receivedChainContainsAnchorCertificate ? 'Yes' : 'No'}
                      </Text>
                    </Flex>
                    <Flex align="center">
                      <StatusIcon
                        status={receivedChainHasValidOrder ? 'PASS' : 'FAIL'}
                      />
                      <Text px="1">Received Chain Has Valid Order</Text>
                      <Text ml="auto">
                        {receivedChainHasValidOrder ? 'Yes' : 'No'}
                      </Text>
                    </Flex>
                    <Flex align="center">
                      <StatusIcon
                        status={verifiedChainHasSha1Signature ? 'FAIL' : 'PASS'}
                      />
                      <Text px="1">Verified Chain Free of SHA1 Signature</Text>
                      <Text ml="auto">
                        {verifiedChainHasSha1Signature ? 'No' : 'Yes'}
                      </Text>
                    </Flex>
                    <Flex align="center">
                      <StatusIcon
                        status={
                          verifiedChainHasLegacySymantecAnchor ? 'FAIL' : 'PASS'
                        }
                      />
                      <Text px="1">
                        Verified Chain Free of Legacy Symantec Anchor
                      </Text>
                      <Text ml="auto">
                        {verifiedChainHasLegacySymantecAnchor ? 'No' : 'Yes'}
                      </Text>
                    </Flex>
                  </Box>
                  <Accordion allowMultiple>
                    {certificateInfoChain.map(
                      (
                        {
                          notValidBefore,
                          notValidAfter,
                          issuer,
                          subject,
                          expiredCert,
                          selfSignedCert,
                          certRevoked,
                          certRevokedStatus,
                          commonNames,
                          serialNumber,
                          signatureHashAlgorithm,
                          sanList,
                        },
                        idx,
                      ) => {
                        return (
                          <AccordionItem key={idx}>
                            <Box
                              rounded="md"
                              px="2"
                              my="2"
                              borderWidth="1px"
                              bg={
                                expiredCert ||
                                certRevoked ||
                                signatureHashAlgorithm !== 'sha256'
                                  ? 'weakMuted'
                                  : 'gray.100'
                              }
                              borderColor={
                                expiredCert ||
                                certRevoked ||
                                signatureHashAlgorithm !== 'sha256'
                                  ? 'weak'
                                  : 'gray.300'
                              }
                            >
                              <Text fontWeight="bold">
                                {idx + 1}. {commonNames[0]}
                              </Text>
                              <Flex align="center">
                                <Text mr="1">Not After:</Text>
                                <Text color={expiredCert && 'weak'}>
                                  {notValidAfter} UTC
                                </Text>
                              </Flex>
                              <Text>
                                Siganture Hash:{' '}
                                {signatureHashAlgorithm.toUpperCase()}
                              </Text>
                              <AccordionButton color="blue.500" variant="link">
                                <PlusSquareIcon mr="1" />
                                More details
                              </AccordionButton>
                              <AccordionPanel>
                                <Text>Names: {commonNames}</Text>
                                <Text>Subject: {subject}</Text>
                                <Text>Serial: {serialNumber}</Text>
                                <Text>Not Before: {notValidBefore}</Text>
                                <Text>Not After: {notValidAfter}</Text>
                                <Text
                                  fontWeight={expiredCert ? 'bold' : ''}
                                  color={expiredCert ? 'weak' : 'black'}
                                >
                                  Expired: {expiredCert ? 'Yes' : 'No'}
                                </Text>
                                <Text>Issuer: {issuer}</Text>
                                <Text>
                                  Self-signed: {selfSignedCert ? 'Yes' : 'No'}
                                </Text>
                                <Text
                                  fontWeight={certRevoked ? 'bold' : ''}
                                  color={certRevoked ? 'weak' : 'black'}
                                >
                                  Revoked: {certRevoked ? 'Yes' : 'No'} (
                                  {certRevokedStatus})
                                </Text>
                                <Text>
                                  Hash Algorithm:{' '}
                                  {signatureHashAlgorithm.toUpperCase()}
                                </Text>
                                <Flex>
                                  <Text mr="1">SAN List:</Text>
                                  {sanList.map((san, idx) => {
                                    return (
                                      <>
                                        {san}
                                        {idx < sanList.length - 1 && ', '}
                                      </>
                                    )
                                  })}
                                </Flex>
                              </AccordionPanel>
                            </Box>
                          </AccordionItem>
                        )
                      },
                    )}
                  </Accordion>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </Box>
  )

  let dmarcSteps

  switch (dmarcPhase) {
    case 'assess':
      dmarcSteps = [
        t`Identify all domains and subdomains used to send mail;`,
        t`Assess current state;`,
        t`Deploy initial DMARC records with policy of none; and`,
        t`Collect and analyze DMARC reports.`,
      ]
      break
    case 'deploy':
      dmarcSteps = [
        t`Identify all authorized senders;`,
        t`Deploy SPF records for all domains;`,
        t`Deploy DKIM records and keys for all domains and senders; and`,
        t`Monitor DMARC reports and correct misconfigurations.`,
      ]
      break
    case 'enforce':
      dmarcSteps = [
        t`Upgrade DMARC policy to quarantine (gradually increment enforcement from 25% to 100%;`,
        t`Upgrade DMARC policy to reject (gradually increment enforcement from 25% to 100%); and`,
        t`Reject all messages from non-mail domains.`,
      ]
      break
    case 'maintain':
      dmarcSteps = [
        t`Monitor DMARC reports;`,
        t`Correct misconfigurations and update records as required; and`,
        t`Rotate DKIM keys annually.`,
      ]
      break
    default:
      dmarcSteps = undefined
      break
  }

  const dmarcStepList = !dmarcSteps
    ? undefined
    : dmarcSteps.map((step, idx) => {
        return <ListItem key={idx}>{step}</ListItem>
      })

  const { dkim, dmarc, spf } = dnsResults
  let negativeDkimCount = 0
  dkim.selectors.forEach(({ negativeTags }) => {
    negativeDkimCount += negativeTags.length
  })

  const emailSummary = (
    <Accordion allowMultiple defaultIndex={[0]}>
      <AccordionItem>
        <Flex align="center" as={AccordionButton}>
          <Text fontSize="2xl">DNS Result Summary</Text>
          <Flex
            py="1"
            px="2"
            align="center"
            borderWidth="2px"
            bg="gray.100"
            borderColor="gray.300"
            rounded="md"
            ml="auto"
          >
            <NumberedStatusIcon number={0} status="FAIL" />
            <Text px="1" fontWeight="bold" color="weak">
              Negative
            </Text>
          </Flex>
          <Flex
            py="1"
            px="2"
            align="center"
            borderWidth="2px"
            bg="gray.100"
            borderColor="gray.300"
            rounded="md"
            mx="1"
          >
            <NumberedStatusIcon number={7} status="INFO" />
            <Text px="1" fontWeight="bold" color="info">
              Informative
            </Text>
          </Flex>
          <Flex
            py="1"
            px="2"
            align="center"
            borderWidth="2px"
            bg="gray.100"
            borderColor="gray.300"
            rounded="md"
            mr="1"
          >
            <NumberedStatusIcon number={3} status="PASS" />
            <Text px="1" fontWeight="bold" color="strong">
              Positive
            </Text>
          </Flex>
          <AccordionIcon boxSize="icons.xl" />
        </Flex>
        <AccordionPanel>
          {Object.keys(dnsResults).map((key, idx) => {
            let passCount = 0
            let infoCount = 0
            let failCount = 0

            if (key === 'dmarc' || key === 'spf') {
              const { positiveTags, neutralTags, negativeTags } =
                dnsResults[key]
              passCount = positiveTags.length
              infoCount = neutralTags.length
              failCount = negativeTags.length
            } else if (key === 'dkim') {
              dnsResults.dkim.selectors.forEach(
                ({ positiveTags, neutralTags, negativeTags }) => {
                  passCount += positiveTags.length
                  infoCount += neutralTags.length
                  failCount += negativeTags.length
                },
              )
            } else {
              return
            }
            return (
              <Flex key={idx} align="center" py="1">
                <Text fontSize="xl" pr="2">
                  {key.toUpperCase()}
                </Text>
                <Flex
                  py="1"
                  px="2"
                  align="center"
                  borderWidth="2px"
                  bg="gray.100"
                  borderColor="gray.300"
                  rounded="md"
                  ml="auto"
                >
                  <NumberedStatusIcon number={failCount} status="FAIL" />
                  <Text px="1" fontWeight="bold" color="weak">
                    Negative
                  </Text>
                </Flex>
                <Flex
                  py="1"
                  px="2"
                  align="center"
                  borderWidth="2px"
                  bg="gray.100"
                  borderColor="gray.300"
                  rounded="md"
                  mx="1"
                >
                  <NumberedStatusIcon number={infoCount} status="INFO" />
                  <Text px="1" fontWeight="bold" color="info">
                    Informative
                  </Text>
                </Flex>
                <Flex
                  py="1"
                  px="2"
                  align="center"
                  borderWidth="2px"
                  bg="gray.100"
                  borderColor="gray.300"
                  rounded="md"
                  mr="2.25rem"
                >
                  <NumberedStatusIcon number={passCount} status="PASS" />
                  <Text px="1" fontWeight="bold" color="strong">
                    Positive
                  </Text>
                </Flex>
              </Flex>
            )
          })}
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  )

  return (
    <Flex flexDirection="column" width="100%">
      <Flex
        flexDirection={{ base: 'column', md: 'row' }}
        alignItems="center"
        mb="4"
      >
        <IconButton
          icon={<ArrowLeftIcon />}
          //   onClick={() => history.push(from)}
          color="gray.900"
          fontSize="2xl"
          aria-label="back"
          mr="0.5rem"
        />
        <Heading textAlign={{ base: 'center', md: 'left' }}>
          {domainName.toUpperCase()}
        </Heading>
        <ScanDomainButton domainUrl={domainName} ml="auto" />
        {data.findDomainByDomain.hasDMARCReport && (
          <Button
            ml="2"
            variant="primary"
            as={RouteLink}
            to={`/domains/${domainName}/dmarc-report/LAST30DAYS/${new Date().getFullYear()}`}
          >
            <Text whiteSpace="noWrap">
              <Trans>DMARC Report</Trans>
            </Text>
          </Button>
        )}
      </Flex>
      <Tabs isFitted variant="enclosed-colored">
        <TabList mb="4">
          <Tab borderTopWidth="0.25">WWW Guidance</Tab>
          <Tab borderTopWidth="0.25">Email Guidance</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            {/* web guidance */}
            {endPointSummary}
            {endpointSelect}
            <Box>
              {connectionGuidance}
              {tlsGuidance}
            </Box>
          </TabPanel>
          <TabPanel>
            {/* email guidance */}
            <Box>
              {emailSummary}
              <Box mb={4} ml="4">
                <Text fontWeight="bold" fontSize="2xl">
                  <Trans>
                    DMARC Implementation Phase: {dmarcPhase.toUpperCase()}
                  </Trans>
                </Text>
                {/* <OrderedList>{dmarcStepList}</OrderedList> */}
                {dmarcSteps && (
                  <Box
                    bg="gray.100"
                    px="2"
                    py="1"
                    borderWidth="1px"
                    borderColor="gray.300"
                    rounded="md"
                  >
                    <OrderedList>{dmarcStepList}</OrderedList>
                  </Box>
                )}
              </Box>
              <Accordion allowMultiple>
                <AccordionItem>
                  <Flex as={AccordionButton}>
                    {dmarc.negativeTags.length > 0 ? (
                      <NumberedStatusIcon
                        number={dmarc.negativeTags.length}
                        status="FAIL"
                      />
                    ) : (
                      <StatusIcon boxSize="icons.lg" status="PASS" />
                    )}
                    <Text fontSize="2xl" ml="2">
                      DMARC
                    </Text>
                    <AccordionIcon boxSize="icons.xl" />
                  </Flex>
                  <AccordionPanel>
                    <Box>
                      <Text>{dmarc.record}</Text>
                      <Text>{dmarc.pPolicy}</Text>
                      <Text>{dmarc.spPolicy}</Text>
                      <Text>{dmarc.pct}</Text>
                    </Box>
                    <GuidanceTagList
                      positiveTags={dmarc.positiveTags}
                      neutralTags={dmarc.neutralTags}
                      negativeTags={dmarc.negativeTags}
                    />
                  </AccordionPanel>
                </AccordionItem>
                <AccordionItem>
                  <Flex as={AccordionButton}>
                    {spf.negativeTags.length > 0 ? (
                      <NumberedStatusIcon
                        number={spf.negativeTags.length}
                        status="FAIL"
                      />
                    ) : (
                      <StatusIcon boxSize="icons.lg" status="PASS" />
                    )}
                    <Text fontSize="2xl" ml="2">
                      SPF
                    </Text>
                    <AccordionIcon boxSize="icons.xl" />
                  </Flex>
                  <AccordionPanel>
                    <Box>
                      <Text>{spf.record}</Text>
                      <Text>{spf.lookups}</Text>
                      <Text>{spf.spfDefault}</Text>
                    </Box>
                    <GuidanceTagList
                      positiveTags={spf.positiveTags}
                      neutralTags={spf.neutralTags}
                      negativeTags={spf.negativeTags}
                    />
                  </AccordionPanel>
                </AccordionItem>
                <AccordionItem>
                  <Flex as={AccordionButton}>
                    {dmarc.negativeTags.length > 0 ? (
                      <NumberedStatusIcon
                        number={negativeDkimCount}
                        status="FAIL"
                      />
                    ) : (
                      <StatusIcon boxSize="icons.lg" status="PASS" />
                    )}
                    <Text fontSize="2xl" ml="2">
                      DKIM
                    </Text>
                    <AccordionIcon boxSize="icons.xl" />
                  </Flex>
                  <AccordionPanel>
                    {dkim.selectors.length > 0 ? (
                      dkim.selectors.map(
                        ({
                          selector,
                          positiveTags,
                          neutralTags,
                          negativeTags,
                        }) => {
                          return (
                            <>
                              <Text fontWeight="bold" fontSize="xl">
                                {selector}
                              </Text>
                              <GuidanceTagList
                                positiveTags={positiveTags}
                                neutralTags={neutralTags}
                                negativeTags={negativeTags}
                              />
                            </>
                          )
                        },
                      )
                    ) : (
                      <Text>
                        No DKIM selectors are currently attached to this domain.
                        Please contact an admin of the affiliated organization
                        to add selectors.
                      </Text>
                    )}
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Flex>
  )
}

export default NewGuidancePage
