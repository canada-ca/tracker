import React from 'react'
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  AlertDescription,
  AlertTitle,
  Box,
  Flex,
  Link,
  Text,
} from '@chakra-ui/react'
import { object } from 'prop-types'
import { PlusSquareIcon } from '@chakra-ui/icons'
import { StatusIcon } from '../components/StatusIcon'
import { GuidanceTagList } from './GuidanceTagList'
import { Trans, t } from '@lingui/macro'
import { DetailTooltip } from './DetailTooltip'
import { NotificationBanner } from '../app/NotificationBanner'

export function WebTLSResults({ tlsResult }) {
  const weakProtocolNames = {
    ssl2_0CipherSuites: 'SSL 2.0',
    ssl3_0CipherSuites: 'SSL 3.0',
    tls1_0CipherSuites: 'TLS 1.0',
    tls1_1CipherSuites: 'TLS 1.1',
  }

  const cipherStrengths = {
    weak: t`weak`,
    phase_out: t`phase out`,
    acceptable: t`acceptable`,
    strong: t`strong`,
  }

  const { tls1_2CipherSuites: tls1_2, tls1_3CipherSuites: tls1_3, __typename, ...rest } = tlsResult.acceptedCipherSuites

  const weakProtocols = Object.keys(rest).filter((protocol) => {
    return rest[protocol]?.length > 0
  })

  const cipherStyleProps = {
    align: 'center',
    borderBottomWidth: '1px',
    borderBottomColor: 'gray.300',
    py: '0.5',
    px: { base: '2', md: '4' },
  }

  const tlsProtocols = (
    <Box>
      <Flex as={AccordionButton}>
        <StatusIcon status={tlsResult.protocolStatus} />
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
              return rest[protocol]?.map(({ name }, idx) => {
                return (
                  <Flex key={`${protocol}-${idx}`} {...cipherStyleProps}>
                    <Flex align="center" minW="50%">
                      <Text color="weak">{name}</Text>
                    </Flex>
                    <Text color="weak">{weakProtocolNames[protocol]}</Text>
                  </Flex>
                )
              })
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

  const _weakCiphers = (suite) => {
    const weakIndex = suite?.findIndex(({ strength }) => strength === 'weak')
    if (weakIndex === -1) return false
    return true
  }

  const cipherCurveTextColor = (strength) => {
    return strength === 'weak' ? 'weak' : 'black'
  }

  const tlsCiphers = (
    <Box>
      <Flex as={AccordionButton}>
        <StatusIcon status={tlsResult.cipherStatus} />
        <Text ml="2" mr="1" fontSize="xl">
          <Trans>Cipher Suites</Trans>
        </Text>
        <AccordionIcon boxSize="icons.xl" />
      </Flex>
      <AccordionPanel>
        <Box px="2">
          {tls1_2?.length > 0 && (
            <Box>
              <Text fontSize="xl" fontWeight="bold" as="u" pb="2">
                TLS 1.2
              </Text>
              {tls1_2?.map(({ name, strength }, idx) => {
                return (
                  <Flex key={idx} {...cipherStyleProps}>
                    <Flex align="center" minW="50%">
                      <Text color={cipherCurveTextColor(strength)}>{name}</Text>
                    </Flex>
                    <Text color={cipherCurveTextColor(strength)}>{cipherStrengths[strength].toUpperCase()}</Text>
                  </Flex>
                )
              })}
            </Box>
          )}
          {tls1_3?.length > 0 && (
            <Box>
              <Text fontSize="xl" as="u" fontWeight="bold" pb="2">
                TLS 1.3
              </Text>
              {tls1_3?.map(({ name, strength }, idx) => {
                return (
                  <Flex key={idx} {...cipherStyleProps}>
                    <Flex align="center" minW="50%">
                      <Text color={cipherCurveTextColor(strength)}>{name}</Text>
                    </Flex>
                    <Text color={cipherCurveTextColor(strength)}>{cipherStrengths[strength].toUpperCase()}</Text>
                  </Flex>
                )
              })}
            </Box>
          )}
        </Box>
      </AccordionPanel>
    </Box>
  )

  const tlsCurves = (
    <>
      <Flex as={AccordionButton}>
        <StatusIcon status={tlsResult.curveStatus} />
        <Text ml="2" mr="1" fontSize="xl">
          <Trans>Curves</Trans>
        </Text>
        <AccordionIcon boxSize="icons.xl" />
      </Flex>
      <AccordionPanel>
        <Box px="2">
          {tlsResult.acceptedEllipticCurves?.map(({ name, strength }, idx) => {
            return (
              <Flex key={idx} {...cipherStyleProps}>
                <Flex align="center" minW="50%">
                  <Text color={cipherCurveTextColor(strength)}>{name}</Text>
                </Flex>
                <Text color={cipherCurveTextColor(strength)}>{cipherStrengths[strength].toUpperCase()}</Text>
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
    passedValidation,
    hasEntrustCertificate,
  } = tlsResult?.certificateChainInfo || {}

  const { robotVulnerable, heartbleedVulnerable } = tlsResult

  const tlsStatus = [
    tlsResult.certificateStatus,
    tlsResult.protocolStatus,
    tlsResult.cipherStatus,
    tlsResult.curveStatus,
  ].every((status) => status.toUpperCase() === 'PASS')
    ? 'PASS'
    : 'FAIL'

  const columnInfoStyleProps = {
    align: 'center',
    py: '0.5',
    px: '2',
    _even: { bg: 'gray.200' },
  }

  return (
    <AccordionItem>
      <Flex as={AccordionButton}>
        <StatusIcon status={tlsStatus} boxSize="icons.lg" />
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

        <Box fontSize="lg" px="2">
          <Flex {...columnInfoStyleProps}>
            <DetailTooltip label={t`Shows if the server was found to be vulnerable to the Heartbleed vulnerability.`}>
              <StatusIcon
                status={heartbleedVulnerable === true ? 'FAIL' : heartbleedVulnerable === false ? 'PASS' : 'INFO'}
              />
              <Text px="1" fontWeight={heartbleedVulnerable ? 'bold' : ''}>
                <Trans>Heartbleed Vulnerable</Trans>
              </Text>
            </DetailTooltip>
            <Text fontWeight={heartbleedVulnerable ? 'bold' : ''}>
              {heartbleedVulnerable === true ? t`Yes` : heartbleedVulnerable === false ? t`No` : t`Unknown`}
            </Text>
          </Flex>
          <Flex {...columnInfoStyleProps}>
            <DetailTooltip label={t`Shows if the server was found to be vulnerable to the ROBOT vulnerability.`}>
              <StatusIcon
                status={
                  ['VULNERABLE_WEAK_ORACLE', 'VULNERABLE_STRONG_ORACLE'].includes(robotVulnerable)
                    ? 'FAIL'
                    : ['NOT_VULNERABLE_NO_ORACLE', 'NOT_VULNERABLE_RSA_NOT_SUPPORTED'].includes(robotVulnerable)
                    ? 'PASS'
                    : 'INFO'
                }
              />
              <Text
                px="1"
                fontWeight={
                  ['VULNERABLE_WEAK_ORACLE', 'VULNERABLE_STRONG_ORACLE'].includes(robotVulnerable) ? 'bold' : ''
                }
              >
                <Trans>ROBOT Vulnerable</Trans>
              </Text>
            </DetailTooltip>
            <Text>{robotVulnerable || t`Unknown`}</Text>
          </Flex>
        </Box>

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
                <Flex borderWidth="1px" borderColor="black" px="2" py="1" rounded="md">
                  <Text fontSize="lg">
                    <Trans>Certificate chain info could not be found during the scan.</Trans>
                  </Text>
                </Flex>
              ) : (
                <>
                  <Box fontSize="lg" px="2">
                    <Flex {...columnInfoStyleProps} bg={badHostname ? 'weakMuted' : ''}>
                      <DetailTooltip
                        label={t`Shows if the hostname on the server certificate matches the the hostname from the HTTP request.`}
                      >
                        <StatusIcon status={badHostname ? 'FAIL' : 'PASS'} />
                        <Text px="1" fontWeight={badHostname ? 'bold' : ''}>
                          <Trans>Hostname Matches</Trans>
                        </Text>
                      </DetailTooltip>
                      <Text fontWeight={badHostname ? 'bold' : ''}>{badHostname ? t`No` : t`Yes`}</Text>
                    </Flex>
                    <Flex {...columnInfoStyleProps}>
                      <DetailTooltip
                        label={t`Shows if the leaf certificate includes the "OCSP Must-Staple" extension.`}
                      >
                        <StatusIcon status="INFO" />
                        <Text px="1">
                          <Trans>Must Staple</Trans>
                        </Text>
                      </DetailTooltip>
                      <Text>{mustHaveStaple ? t`Yes` : t`No`}</Text>
                    </Flex>
                    <Flex {...columnInfoStyleProps}>
                      <DetailTooltip label={t`Shows if the leaf certificate is an Extended Validation Certificate.`}>
                        <StatusIcon status={leafCertificateIsEv ? 'PASS' : 'INFO'} />
                        <Text px="1">
                          <Trans>Leaf Certificate is EV</Trans>
                        </Text>
                      </DetailTooltip>
                      <Text>{leafCertificateIsEv ? t`Yes` : t`No`}</Text>
                    </Flex>
                    <Flex {...columnInfoStyleProps}>
                      <DetailTooltip
                        label={t`Shows if the certificate bundle provided from the server included the root certificate.`}
                      >
                        <StatusIcon status="INFO" />
                        <Text px="1">
                          <Trans>Received Chain Contains Anchor Certificate</Trans>
                        </Text>
                      </DetailTooltip>
                      <Text>{receivedChainContainsAnchorCertificate ? t`Yes` : t`No`}</Text>
                    </Flex>
                    <Flex {...columnInfoStyleProps}>
                      <DetailTooltip
                        label={t`Shows if all the certificates in the bundle provided by the server were sent in the correct order.`}
                      >
                        <StatusIcon status={receivedChainHasValidOrder ? 'PASS' : 'FAIL'} />
                        <Text px="1">
                          <Trans>Received Chain Has Valid Order</Trans>
                        </Text>
                      </DetailTooltip>
                      <Text>{receivedChainHasValidOrder ? t`Yes` : t`No`}</Text>
                    </Flex>
                    <Flex {...columnInfoStyleProps}>
                      <DetailTooltip
                        label={t`Shows if the received certificates are free from the use of the deprecated SHA-1 algorithm.`}
                      >
                        <StatusIcon status={verifiedChainHasSha1Signature ? 'FAIL' : 'PASS'} />
                        <Text px="1">
                          <Trans>Verified Chain Free of SHA1 Signature</Trans>
                        </Text>
                      </DetailTooltip>
                      <Text>{verifiedChainHasSha1Signature ? t`No` : t`Yes`}</Text>
                    </Flex>
                    <Flex {...columnInfoStyleProps}>
                      <DetailTooltip
                        label={t`Shows if the received certificates are not relying on a distrusted Symantec root certificate.`}
                      >
                        <StatusIcon status={verifiedChainHasLegacySymantecAnchor ? 'FAIL' : 'PASS'} />
                        <Text px="1">
                          <Trans>Verified Chain Free of Legacy Symantec Anchor</Trans>
                        </Text>
                      </DetailTooltip>
                      <Text>{verifiedChainHasLegacySymantecAnchor ? t`No` : t`Yes`}</Text>
                    </Flex>
                    <Flex {...columnInfoStyleProps}>
                      <DetailTooltip label={t`Shows if the received certificate chain contains Entrust as the CA.`}>
                        <StatusIcon status="INFO" />
                        <Text px="1">
                          <Trans>Entrust Certificate</Trans>
                        </Text>
                      </DetailTooltip>
                      <Text>{hasEntrustCertificate ? t`Yes` : t`No`}</Text>
                    </Flex>
                  </Box>

                  {hasEntrustCertificate && (
                    <NotificationBanner
                      status="warning"
                      bannerId={`entrust-certificate-${certificateChain[0].commonNames[0]}`}
                      hideable
                    >
                      <Box>
                        <AlertTitle>
                          <Trans>Entrust Certificate Detected</Trans>
                        </AlertTitle>
                        <AlertDescription>
                          <Trans>
                            Entrust Certificates issued after October 31, 2024{' '}
                            <Link
                              href="https://security.googleblog.com/2024/06/sustaining-digital-certificate-security.html"
                              color="blue.600"
                              isExternal
                            >
                              will be distrusted
                            </Link>{' '}
                            in Chrome 127 and later versions. Immediate action is required to maintain user access.
                            Failure to act may result in security warnings or access issues for Chromes users.
                          </Trans>
                        </AlertDescription>
                      </Box>
                    </NotificationBanner>
                  )}

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
                              bg={
                                expiredCert ||
                                certRevoked ||
                                (selfSignedCert && !passedValidation) ||
                                (badHostname && idx === 0)
                                  ? 'weakMuted'
                                  : 'gray.100'
                              }
                              borderColor={
                                expiredCert || certRevoked || (selfSignedCert && !passedValidation)
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
                                <Text color={expiredCert && 'weak'}>{notValidAfter} UTC</Text>
                              </Flex>
                              <Text>
                                <Trans>Signature Hash:</Trans> {signatureHashAlgorithm.toUpperCase()}
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
                                  fontWeight={selfSignedCert && !passedValidation ? 'bold' : ''}
                                  color={selfSignedCert && !passedValidation ? 'weak' : 'black'}
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
                                      <React.Fragment key={idx}>
                                        {san}
                                        {idx < sanList.length - 1 && ', '}
                                      </React.Fragment>
                                    )
                                  })}
                                </Flex>
                                <Text fontWeight={badHostname ? 'bold' : ''} color={badHostname ? 'weak' : 'black'}>
                                  <Trans>Hostname Matches: {badHostname ? t`No` : t`Yes`}</Trans>
                                </Text>
                              </AccordionPanel>
                            </Box>
                          </AccordionItem>
                        )
                      },
                    )}
                  </Accordion>
                  <Box mx="2" mt="2">
                    <Text mb="1" fontWeight="bold" textAlign="lg">
                      <Trans>Certification Paths</Trans>
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
