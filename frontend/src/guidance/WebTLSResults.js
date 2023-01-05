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
import { GuidanceTagList } from './GuidanceTagList'
import { Trans, t } from '@lingui/macro'

export function WebTLSResults({ tlsResult }) {
  const weakProtocolNames = {
    ssl2_0CipherSuites: 'SSL 2.0',
    ssl3_0CipherSuites: 'SSL 3.0',
    tls1_0CipherSuites: 'TLS 1.0',
    tls1_1CipherSuites: 'TLS 1.1',
  }

  const cipherStrengths = {
    weak: t`weak`,
    acceptable: t`acceptable`,
    strong: t`strong`,
  }

  const { tls1_2CipherSuites: tls1_2, tls1_3CipherSuites: tls1_3, __typename, ...rest } = tlsResult.acceptedCipherSuites

  const weakProtocols = Object.keys(rest).filter((protocol) => {
    return rest[protocol]?.length > 0
  })

  const columnInfoStyleProps = {
    align: 'center',
    borderBottomWidth: '1px',
    borderBottomColor: 'gray.300',
    mb: '1',
    px: { base: '2', md: '4' },
  }

  const tlsProtocols = (
    <Box>
      <Flex as={AccordionButton}>
        <StatusIcon status={weakProtocols?.length > 0 ? 'FAIL' : 'PASS'} />
        <Text ml="2" mr="1" fontSize="xl">
          <Trans>Protocols</Trans>
        </Text>
        <AccordionIcon boxSize="icons.xl" />
      </Flex>
      <AccordionPanel>
        {weakProtocols?.length > 0 ? (
          <Box px="2">
            <Text fontSize="lg" mb="1">
              <Trans>The following ciphers are from known weak protocols and must be disabled:</Trans>
            </Text>
            {weakProtocols?.map((protocol) => {
              return (
                <>
                  {rest[protocol]?.map(({ name }, idx) => {
                    return (
                      <Flex key={idx} {...columnInfoStyleProps}>
                        <Text color="weak" minW="50%">
                          {name}
                        </Text>
                        <Text color="weak">{weakProtocolNames[protocol]}</Text>
                      </Flex>
                    )
                  })}
                </>
              )
            })}
          </Box>
        ) : (
          <Box bg="strongMuted">
            <Text px="2" py="1" fontSize="lg">
              <Trans>No known weak protocols used.</Trans>
            </Text>
          </Box>
        )}
      </AccordionPanel>
    </Box>
  )

  const weakCiphers = (suite) => {
    const weakIndex = suite?.findIndex(({ strength }) => strength === 'weak')
    if (weakIndex === -1) return false
    return true
  }

  const tlsCiphers = (
    <Box>
      <Flex as={AccordionButton}>
        <StatusIcon status={weakCiphers(tls1_2) || weakCiphers(tls1_3) ? 'FAIL' : 'PASS'} />
        <Text ml="2" mr="1" fontSize="xl">
          <Trans>Ciphers</Trans>
        </Text>
        <AccordionIcon boxSize="icons.xl" />
      </Flex>
      <AccordionPanel>
        <Box px="2">
          {tls1_2?.length > 0 && (
            <>
              <Text fontSize="xl" fontWeight="bold" as="u" pb="2">
                TLS 1.2
              </Text>
              {tls1_2?.map(({ name, strength }, idx) => {
                return (
                  <Flex key={idx} {...columnInfoStyleProps}>
                    <Text color={strength === 'weak' ? 'weak' : 'black'} minW="50%">
                      {name}
                    </Text>
                    <Text color={strength === 'weak' ? 'weak' : 'black'}>
                      {cipherStrengths[strength].toUpperCase()}
                    </Text>
                  </Flex>
                )
              })}
            </>
          )}
          {tls1_3?.length > 0 && (
            <>
              <Text fontSize="xl" as="u" fontWeight="bold" pb="2">
                TLS 1.3
              </Text>
              {tls1_3?.map(({ name, strength }, idx) => {
                return (
                  <Flex key={idx} {...columnInfoStyleProps}>
                    <Text color={strength === 'weak' ? 'weak' : 'black'} minW="50%">
                      {name}
                    </Text>
                    <Text color={strength === 'weak' ? 'weak' : 'black'}>
                      {cipherStrengths[strength].toUpperCase()}
                    </Text>
                  </Flex>
                )
              })}
            </>
          )}
        </Box>
      </AccordionPanel>
    </Box>
  )

  const tlsCurves = (
    <>
      <Flex as={AccordionButton}>
        <StatusIcon status={weakCiphers(tlsResult.acceptedEllipticCurves) ? 'FAIL' : 'PASS'} />
        <Text ml="2" mr="1" fontSize="xl">
          <Trans>Curves</Trans>
        </Text>
        <AccordionIcon boxSize="icons.xl" />
      </Flex>
      <AccordionPanel>
        <Box px="2">
          {tlsResult.acceptedEllipticCurves?.map(({ name, strength }, idx) => {
            return (
              <Flex key={idx} {...columnInfoStyleProps}>
                <Text color={strength === 'weak' ? 'weak' : 'black'} minW="50%">
                  {name}
                </Text>
                <Text color={strength === 'weak' ? 'weak' : 'black'}>{cipherStrengths[strength].toUpperCase()}</Text>
              </Flex>
            )
          })}
        </Box>
      </AccordionPanel>
    </>
  )

  const {
    badHostname,
    mustHaveStaple,
    leafCertificateIsEv,
    receivedChainContainsAnchorCertificate,
    receivedChainHasValidOrder,
    verifiedChainHasSha1Signature,
    verifiedChainHasLegacySymantecAnchor,
    certificateChain,
    pathValidationResults,
  } = tlsResult?.certificateChainInfo || {}

  return (
    <AccordionItem>
      <Flex as={AccordionButton}>
        {tlsResult.negativeTags.length > 0 ? (
          <NumberedStatusIcon number={tlsResult.negativeTags.length} status="FAIL" />
        ) : (
          <StatusIcon status="PASS" boxSize="icons.lg" />
        )}
        <Text fontSize="2xl" ml="2">
          <Trans>TLS Results</Trans>
        </Text>
        <AccordionIcon boxSize="icons.xl" />
      </Flex>
      <AccordionPanel>
        <GuidanceTagList
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
              {tlsResult?.certificateChainInfo === null ? (
                <Flex borderWidth="1px" borderColor="black" px="2" py="1">
                  <Text fontSize="lg" fontWeight="bold">
                    <Trans>Certificate chain info could not be found during the scan.</Trans>
                  </Text>
                </Flex>
              ) : (
                <>
                  <Box fontSize="lg" px="2">
                    <Flex align="center" mb="1" px="2" bg={badHostname ? 'weakMuted' : ''}>
                      <StatusIcon status={badHostname ? 'FAIL' : 'PASS'} />
                      <Text px="1" minW="50%" fontWeight={badHostname ? 'bold' : ''}>
                        <Trans>Hostname Matches</Trans>
                      </Text>
                      <Text fontWeight={badHostname ? 'bold' : ''}>{badHostname ? t`No` : t`Yes`}</Text>
                    </Flex>
                    <Flex align="center" mb="1" px="2" bg="gray.200">
                      <StatusIcon status="INFO" />
                      <Text px="1" minW="50%">
                        <Trans>Must Staple</Trans>
                      </Text>
                      <Text>{mustHaveStaple ? t`Yes` : t`No`}</Text>
                    </Flex>
                    <Flex align="center" mb="1" px="2">
                      <StatusIcon status={leafCertificateIsEv ? 'PASS' : 'INFO'} />
                      <Text px="1" minW="50%">
                        <Trans>Leaf Certificate is EV</Trans>
                      </Text>
                      <Text>{leafCertificateIsEv ? t`Yes` : t`No`}</Text>
                    </Flex>
                    <Flex align="center" mb="1" px="2" bg="gray.200">
                      <StatusIcon status="INFO" />
                      <Text px="1" minW="50%">
                        <Trans>Received Chain Contains Anchor Certificate</Trans>
                      </Text>
                      <Text>{receivedChainContainsAnchorCertificate ? t`Yes` : t`No`}</Text>
                    </Flex>
                    <Flex align="center" mb="1" px="2">
                      <StatusIcon status={receivedChainHasValidOrder ? 'PASS' : 'FAIL'} />
                      <Text px="1" minW="50%">
                        <Trans>Received Chain Has Valid Order</Trans>
                      </Text>
                      <Text>{receivedChainHasValidOrder ? t`Yes` : t`No`}</Text>
                    </Flex>
                    <Flex align="center" mb="1" px="2" bg="gray.200">
                      <StatusIcon status={verifiedChainHasSha1Signature ? 'FAIL' : 'PASS'} />
                      <Text px="1" minW="50%">
                        <Trans>Verified Chain Free of SHA1 Signature</Trans>
                      </Text>
                      <Text>{verifiedChainHasSha1Signature ? t`No` : t`Yes`}</Text>
                    </Flex>
                    <Flex align="center" mb="1" px="2">
                      <StatusIcon status={verifiedChainHasLegacySymantecAnchor ? 'FAIL' : 'PASS'} />
                      <Text px="1" minW="50%">
                        <Trans>Verified Chain Free of Legacy Symantec Anchor</Trans>
                      </Text>
                      <Text>{verifiedChainHasLegacySymantecAnchor ? t`No` : t`Yes`}</Text>
                    </Flex>
                  </Box>
                  <Accordion allowMultiple defaultIndex={[]}>
                    {certificateChain.map(
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
                              mx="2"
                              px="2"
                              my="2"
                              borderWidth="1px"
                              bg={expiredCert || certRevoked || selfSignedCert ? 'weakMuted' : 'gray.100'}
                              borderColor={expiredCert || certRevoked || selfSignedCert ? 'weak' : 'gray.300'}
                            >
                              <Text fontWeight="bold">
                                {idx + 1}. {commonNames[0]}
                              </Text>
                              <Flex align="center">
                                <Text mr="1">
                                  <Trans>Not After:</Trans>
                                </Text>
                                <Text color={expiredCert && 'weak'}>{notValidAfter} UTC</Text>
                              </Flex>
                              <Text>
                                <Trans>Siganture Hash:</Trans> {signatureHashAlgorithm.toUpperCase()}
                              </Text>
                              <AccordionButton color="blue.500" variant="link">
                                <PlusSquareIcon mr="1" />
                                <Trans>More details</Trans>
                              </AccordionButton>
                              <AccordionPanel>
                                <Text>
                                  <Trans>Names:</Trans> {commonNames}
                                </Text>
                                <Text>
                                  <Trans>Subject:</Trans> {subject}
                                </Text>
                                <Text>
                                  <Trans>Serial:</Trans> {serialNumber}
                                </Text>
                                <Text>
                                  <Trans>Not Before:</Trans> {notValidBefore}
                                </Text>
                                <Text>
                                  <Trans>Not After:</Trans> {notValidAfter}
                                </Text>
                                <Text fontWeight={expiredCert ? 'bold' : ''} color={expiredCert ? 'weak' : 'black'}>
                                  <Trans>Expired:</Trans> {expiredCert ? t`Yes` : t`No`}
                                </Text>
                                <Text>
                                  <Trans>Issuer:</Trans> {issuer}
                                </Text>
                                <Text
                                  fontWeight={selfSignedCert ? 'bold' : ''}
                                  color={selfSignedCert ? 'weak' : 'black'}
                                >
                                  <Trans>Self-signed:</Trans> {selfSignedCert ? t`Yes` : t`No`}
                                </Text>
                                <Text fontWeight={certRevoked ? 'bold' : ''} color={certRevoked ? 'weak' : 'black'}>
                                  <Trans>Revoked:</Trans> {certRevoked ? t`Yes` : t`No`} ({certRevokedStatus})
                                </Text>
                                <Text>
                                  <Trans>Hash Algorithm:</Trans> {signatureHashAlgorithm.toUpperCase()}
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
                  <Box mx="2" mt="2">
                    <Text mb="1" fontWeight="bold" textAlign="lg">
                      Certification Paths
                    </Text>
                    {pathValidationResults.map(({ trustStore, wasValidationSuccessful, opensslErrorString }, idx) => {
                      return (
                        <Flex align="center" py="1" key={idx} px="2" bg={idx % 2 !== 0 ? 'gray.200' : 'gray.50'}>
                          <StatusIcon status={wasValidationSuccessful ? 'PASS' : 'FAIL'} />
                          <Text mx="1">
                            {trustStore.name} ({trustStore.version})
                          </Text>
                          {!wasValidationSuccessful && <Text color="weak">{opensslErrorString}</Text>}
                        </Flex>
                      )
                    })}
                  </Box>
                </>
              )}
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
