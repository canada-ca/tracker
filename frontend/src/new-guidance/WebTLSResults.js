import React from 'react'
import { NumberedStatusIcon } from '../components/NumberedStatusIcon'
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Flex,
  Text,
} from '@chakra-ui/react'
import { object } from 'prop-types'
import { PlusSquareIcon } from '@chakra-ui/icons'
import { StatusIcon } from '../components/StatusIcon'
import { NewGuidanceTagList } from './NewGuidanceTagList'
import { Trans, t } from '@lingui/macro'

export function WebTLSResults({ tlsResult }) {
  const weakProtocolNames = {
    'ssl2-0CipherSuites': 'SSL 2.0',
    'ssl3-0CipherSuites': 'SSL 3.0',
    'tls1-0CipherSuites': 'TLS 1.0',
    'tls1-1CipherSuites': 'TLS 1.1',
  }

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
          <Trans>Protocols</Trans>
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
              <Trans>No known weak protocols used.</Trans>
            </Text>
          </Box>
        )}
      </AccordionPanel>
    </Box>
  )

  const weakCiphers = (suite) => {
    const weakIndex = suite.findIndex(({ strength }) => strength === 'weak')
    if (weakIndex === -1) return false
    return true
  }

  const tlsCiphers = (
    <Box>
      <Flex as={AccordionButton}>
        <StatusIcon
          status={weakCiphers(tls1_2) || weakCiphers(tls1_3) ? 'FAIL' : 'PASS'}
        />
        <Text ml="2" mr="1" fontSize="xl">
          <Trans>Ciphers</Trans>
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
            weakCiphers(tlsResult.acceptedEllipticCurves) ? 'FAIL' : 'PASS'
          }
        />
        <Text ml="2" mr="1" fontSize="xl">
          <Trans>Curves</Trans>
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
    badHostname,
    mustHaveStaple,
    leafCertificateIsEv,
    receivedChainContainsAnchorCertificate,
    receivedChainHasValidOrder,
    verifiedChainHasSha1Signature,
    verifiedChainHasLegacySymantecAnchor,
    certificateInfoChain,
  } = tlsResult.certificateChainInfo

  return (
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
          <Trans>TLS Results</Trans>
        </Text>
        <AccordionIcon boxSize="icons.xl" />
      </Flex>
      <AccordionPanel>
        <NewGuidanceTagList
          positiveTags={tlsResult.positiveTags}
          neutralTags={tlsResult.neutralTags}
          negativeTags={tlsResult.negativeTags}
        />

        <Accordion allowMultiple defaultIndex={[0, 1, 2, 3]}>
          <AccordionItem>{tlsProtocols}</AccordionItem>
          <AccordionItem>{tlsCiphers}</AccordionItem>
          <AccordionItem>{tlsCurves}</AccordionItem>

          <AccordionItem>
            <Flex as={AccordionButton}>
              <Text fontSize="xl">
                <Trans>Certificate Chain</Trans>
              </Text>
              <AccordionIcon boxSize="icons.xl" />
            </Flex>
            <AccordionPanel>
              <Box maxW="50%" fontSize="lg">
                <Flex align="center">
                  <StatusIcon status={badHostname ? 'FAIL' : 'PASS'} />
                  <Text px="1">
                    <Trans>Good Hostname</Trans>
                  </Text>
                  <Text ml="auto">{badHostname ? t`No` : t`Yes`}</Text>
                </Flex>
                <Flex align="center">
                  <StatusIcon status="INFO" />
                  <Text px="1">
                    <Trans>Must Staple</Trans>
                  </Text>
                  <Text ml="auto">{mustHaveStaple ? t`Yes` : t`No`}</Text>
                </Flex>
                <Flex align="center">
                  <StatusIcon status={leafCertificateIsEv ? 'PASS' : 'INFO'} />
                  <Text px="1">
                    <Trans>Leaf Certificate is EV</Trans>
                  </Text>
                  <Text ml="auto">{leafCertificateIsEv ? t`Yes` : t`No`}</Text>
                </Flex>
                <Flex align="center">
                  <StatusIcon status="INFO" />
                  <Text px="1">
                    <Trans>Received Chain Contains Anchor Certificate</Trans>
                  </Text>
                  <Text ml="auto">
                    {receivedChainContainsAnchorCertificate ? t`Yes` : t`No`}
                  </Text>
                </Flex>
                <Flex align="center">
                  <StatusIcon
                    status={receivedChainHasValidOrder ? 'PASS' : 'FAIL'}
                  />
                  <Text px="1">
                    <Trans>Received Chain Has Valid Order</Trans>
                  </Text>
                  <Text ml="auto">
                    {receivedChainHasValidOrder ? t`Yes` : t`No`}
                  </Text>
                </Flex>
                <Flex align="center">
                  <StatusIcon
                    status={verifiedChainHasSha1Signature ? 'FAIL' : 'PASS'}
                  />
                  <Text px="1">
                    <Trans>Verified Chain Free of SHA1 Signature</Trans>
                  </Text>
                  <Text ml="auto">
                    {verifiedChainHasSha1Signature ? t`No` : t`Yes`}
                  </Text>
                </Flex>
                <Flex align="center">
                  <StatusIcon
                    status={
                      verifiedChainHasLegacySymantecAnchor ? 'FAIL' : 'PASS'
                    }
                  />
                  <Text px="1">
                    <Trans>Verified Chain Free of Legacy Symantec Anchor</Trans>
                  </Text>
                  <Text ml="auto">
                    {verifiedChainHasLegacySymantecAnchor ? t`No` : t`Yes`}
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
                            <Text mr="1">
                              <Trans>Not After:</Trans>
                            </Text>
                            <Text color={expiredCert && 'weak'}>
                              {notValidAfter} UTC
                            </Text>
                          </Flex>
                          <Text>
                            <Trans>Siganture Hash: </Trans>
                            {signatureHashAlgorithm.toUpperCase()}
                          </Text>
                          <AccordionButton color="blue.500" variant="link">
                            <PlusSquareIcon mr="1" />
                            <Trans>More details</Trans>
                          </AccordionButton>
                          <AccordionPanel>
                            <Text>
                              <Trans>Names: </Trans>
                              {commonNames}
                            </Text>
                            <Text>
                              <Trans>Subject: </Trans>
                              {subject}
                            </Text>
                            <Text>
                              <Trans>Serial: </Trans>
                              {serialNumber}
                            </Text>
                            <Text>
                              <Trans>Not Before: </Trans>
                              {notValidBefore}
                            </Text>
                            <Text>
                              <Trans>Not After: </Trans>
                              {notValidAfter}
                            </Text>
                            <Text
                              fontWeight={expiredCert ? 'bold' : ''}
                              color={expiredCert ? 'weak' : 'black'}
                            >
                              <Trans>Expired: </Trans>
                              {expiredCert ? t`Yes` : t`No`}
                            </Text>
                            <Text>
                              <Trans>Issuer: </Trans>
                              {issuer}
                            </Text>
                            <Text>
                              <Trans>Self-signed: </Trans>
                              {selfSignedCert ? t`Yes` : t`No`}
                            </Text>
                            <Text
                              fontWeight={certRevoked ? 'bold' : ''}
                              color={certRevoked ? 'weak' : 'black'}
                            >
                              <Trans>Revoked: </Trans>
                              {certRevoked ? t`Yes` : t`No`} (
                              {certRevokedStatus})
                            </Text>
                            <Text>
                              <Trans>Hash Algorithm:</Trans>{' '}
                              {signatureHashAlgorithm.toUpperCase()}
                            </Text>
                            <Flex>
                              <Text mr="1">
                                <Trans>SAN List:</Trans>
                              </Text>
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
}

WebTLSResults.propTypes = {
  tlsResult: object,
}
