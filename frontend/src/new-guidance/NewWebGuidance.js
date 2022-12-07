import React, { useState } from 'react'
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
  Select,
  Text,
} from '@chakra-ui/react'
import { array } from 'prop-types'
import { PlusSquareIcon } from '@chakra-ui/icons'
import { StatusIcon } from '../components/StatusIcon'
import { GuidanceTagList } from '../guidance/GuidanceTagList'

export function NewWebGuidance({ webResults }) {
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
            <NumberedStatusIcon number={totalWebFail} status="FAIL" />
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
            <NumberedStatusIcon number={totalWebInfo} status="INFO" />
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
            <NumberedStatusIcon number={totalWebPass} status="PASS" />
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
        <StatusIcon status={weakProtocols.length > 0 ? 'FAIL' : 'PASS'} />
        <Text ml="2" mr="1" fontSize="xl">
          Protocols
        </Text>
        <AccordionIcon boxSize="icons.xl" />
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

  const weakCiphers =
    tls1_2.filter(({ strength }) => {
      return strength === 'weak'
    }) ||
    tls1_3.filter(({ strength }) => {
      return strength === 'weak'
    })

  const tlsCiphers = (
    <Box>
      <Flex as={AccordionButton}>
        <StatusIcon status={weakCiphers.length > 0 ? 'FAIL' : 'PASS'} />
        <Text ml="2" mr="1" fontSize="xl">
          Ciphers
        </Text>
        <AccordionIcon boxSize="icons.xl" />
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
        <StatusIcon
          status={
            tlsResult.acceptedEllipticCurves.filter(({ strength }) => {
              return strength === 'weak'
            }).length > 0
              ? 'FAIL'
              : 'PASS'
          }
        />
        <Text ml="2" mr="1" fontSize="xl">
          Curves
        </Text>
        <AccordionIcon boxSize="icons.xl" />
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
        <GuidanceTagList
          positiveTags={connectionResults.positiveTags}
          neutralTags={connectionResults.neutralTags}
          negativeTags={connectionResults.negativeTags}
        />
        <Accordion allowMultiple defaultIndex={[0, 1]}>
          <AccordionItem>
            <Flex as={AccordionButton}>
              <Text fontSize="xl">HTTP (80) Chain</Text>{' '}
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
              </Text>{' '}
              <Accordion allowMultiple defaultIndex={[]}>
                {httpChainResult.connections.map(
                  ({ uri, connection, error }, idx) => {
                    const { statusCode, headers, blockedCategory, HSTS } =
                      connection
                    return (
                      <AccordionItem key={idx}>
                        <Box
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

                              <AccordionButton color="blue.500" variant="link">
                                <PlusSquareIcon mr="1" />
                                See Headers
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
                            </>
                          )}
                        </Box>
                      </AccordionItem>
                    )
                  },
                )}
              </Accordion>
            </AccordionPanel>
          </AccordionItem>
          <AccordionItem>
            <Flex as={AccordionButton}>
              <Text fontSize="xl">HTTPS (443) Chain</Text>{' '}
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
              <Accordion allowMultiple defaultIndex={[]}>
                {httpsChainResult.connections.map(
                  ({ uri, connection, error }, idx) => {
                    const { statusCode, headers, blockedCategory, HSTS } =
                      connection
                    return (
                      <AccordionItem key={idx}>
                        <Box
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
                              <AccordionButton color="blue.500" variant="link">
                                <PlusSquareIcon mr="1" />
                                See headers
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
                            </>
                          )}
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
                  <StatusIcon status={leafCertificateIsEv ? 'PASS' : 'INFO'} />
                  <Text px="1">Leaf Certificate is EV</Text>
                  <Text ml="auto">{leafCertificateIsEv ? 'Yes' : 'No'}</Text>
                </Flex>
                <Flex align="center">
                  <StatusIcon status="INFO" />
                  <Text px="1">Received Chain Contains Anchor Certificate</Text>
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
              <Accordion allowMultiple defaultIndex={[]}>
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
  )

  return (
    <>
      {endPointSummary}
      {endpointSelect}
      <Accordion
        allowMultiple
        defaultIndex={connectionResults.negativeTags.length > 0 ? [0] : []}
      >
        {connectionGuidance}
        {tlsGuidance}
      </Accordion>
    </>
  )
}

NewWebGuidance.propTypes = {
  webResults: array,
}
