import React, { useState } from 'react'
import { t, Trans } from '@lingui/macro'
import { i18n } from '@lingui/core'
import { Formik } from 'formik'
import {
  Box,
  Button,
  Collapse,
  Divider,
  Flex,
  Heading,
  Icon,
  Spinner,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useToast,
} from '@chakra-ui/react'
import { REQUEST_SCAN } from './graphql/mutations'
import { useMutation, useQuery } from '@apollo/client'
import { LoadingMessage } from './LoadingMessage'
import { fieldRequirements } from './fieldRequirements'
import { object, string } from 'yup'
import DomainField from './DomainField'
import { GET_ONE_TIME_SCANS } from './graphql/queries'
import ScanCategoryDetails from './ScanCategoryDetails'

export function ScanDomain() {
  const toast = useToast()
  const validationSchema = object().shape({
    domain: string().required(
      i18n._(fieldRequirements.domainUrl.required.message),
    ),
  })
  const [openScanIndex, setOpenScanIndex] = useState(-1)

  const [requestScan, { loading }] = useMutation(REQUEST_SCAN, {
    onError(error) {
      toast({
        title: error.message,
        description: t`Unable to request scan, please try again.`,
        status: 'error',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    },
    onCompleted() {
      toast({
        title: t`Scan Request`,
        description: t`Scan of domain successfully requested`,
        status: 'success',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    },
  })

  const { data: oneTimeScansData } = useQuery(GET_ONE_TIME_SCANS)

  if (loading) return <LoadingMessage />

  const getScanTypeFromScan = (scan) => {
    switch (scan.__typename) {
      case 'HttpsSub':
        return 'https'

      case 'DkimSub':
        return 'dkim'

      case 'DmarcSub':
        return 'dmarc'

      case 'SslSub':
        return 'ssl'

      case 'SpfSub':
        return 'spf'
    }
    return scan.__typename
  }

  const mergedScans = []
  const oneTimeScans = oneTimeScansData?.getOneTimeScans
  if (oneTimeScans) {
    oneTimeScans.forEach((scan) => {
      const curScanType = getScanTypeFromScan(scan)

      // check if merged scan with same sharedId already exists
      const mergedScanMatchIndex = mergedScans.findIndex((mergedScan) => {
        return mergedScan.sharedId === scan.sharedId
      })

      if (mergedScanMatchIndex === -1) {
        // no matching scan found, place new merged scan at end of array
        mergedScans.push({
          sharedId: scan.sharedId,
          scan: { [curScanType]: scan },
          domain: scan.domain.domain,
        })
      } else {
        // matching merged scan found, merge current scan with it
        mergedScans[mergedScanMatchIndex].scan[curScanType] = scan
      }
    })
  }

  // TODO: Create list of collapsable scan detail cards

  const dmarcSteps = {
    assess: [
      t`Identify all domains and subdomains used to send mail;`,
      t`Assess current state;`,
      t`Deploy initial DMARC records with policy of none; and`,
      t`Collect and analyze DMARC reports.`,
    ],
    deploy: [
      t`Identify all authorized senders;`,
      t`Deploy SPF records for all domains;`,
      t`Deploy DKIM records and keys for all domains and senders; and`,
      t`Monitor DMARC reports and correct misconfigurations.`,
    ],
    enforce: [
      t`Upgrade DMARC policy to quarantine (gradually increment enforcement from 25% to 100%);`,
      t`Upgrade DMARC policy to reject (gradually increment enforcement from 25%to 100%); and`,
      t`Reject all messages from non-mail domains.`,
    ],
    maintain: [
      t`Monitor DMARC reports;`,
      t`Correct misconfigurations and update records as required; and`,
      t`Rotate DKIM keys annually.`,
    ],
  }

  const generateStatusIcon = (status) => {
    let statusIcon
    if (status === 'PASS') {
      statusIcon = <Icon name="check-circle" color="strong" size="icons.sm" />
    } else if (status === 'FAIL') {
      statusIcon = <Icon name="warning" color="weak" size="icons.sm" />
    } else {
      statusIcon = <Icon name="info" color="info" size="icons.sm" />
    }
    return statusIcon
  }

  return (
    <Box px="2" mx="auto" overflow="hidden">
      <Formik
        validationSchema={validationSchema}
        initialValues={{ domain: '' }}
        onSubmit={async (values) =>
          requestScan({
            variables: {
              domainUrl: values.domain,
            },
          })
        }
      >
        {({ handleSubmit, isSubmitting }) => {
          return (
            <form
              onSubmit={handleSubmit}
              role="form"
              aria-label="form"
              name="form"
            >
              <Box>
                <Text
                  fontSize="2xl"
                  mb="2"
                  textAlign={{ base: 'center', md: 'left' }}
                >
                  <Trans>Request a domain to be scanned:</Trans>
                </Text>
                <DomainField name="domain" mb="4" />

                <Button
                  w={{ base: '100%', md: '25%' }}
                  variant="primary"
                  isLoading={isSubmitting}
                  type="submit"
                  id="submitBtn"
                  fontSize="lg"
                >
                  <Trans>Scan Domain</Trans>
                </Button>
              </Box>
            </form>
          )
        }}
      </Formik>
      <Stack>
        {mergedScans.reverse().map((mergedScan, index) => {
          return (
            <React.Fragment key={`one-time-scan-index:${index}`}>
              <PseudoBox
                width="100%"
                p="4"
                pl={{ md: '8' }}
                alignItems={{ base: 'flex-start', md: 'center' }}
                flexDirection={{ base: 'column', md: 'row' }}
                onClick={() => {
                  if (openScanIndex === index) {
                    setOpenScanIndex(-1)
                    return
                  }

                  setOpenScanIndex(index)
                }}
                _hover={{ bg: ['', 'gray.100'] }}
                role="button"
              >
                <Flex
                  width="100%"
                  p="4"
                  pl={{ md: '8' }}
                  alignItems={{ base: 'flex-start', md: 'center' }}
                  flexDirection={{ base: 'column', md: 'row' }}
                  onClick={() => {
                    if (openScanIndex === index) {
                      setOpenScanIndex(-1)
                      return
                    }

                    setOpenScanIndex(index)
                  }}
                  _hover={{ bg: ['', 'gray.100'] }}
                  role="button"
                >
                  <Box
                    flexGrow={{ md: '2' }}
                    flexBasis={{ md: '5em' }}
                    mr={{ md: '1em' }}
                    flexShrink={{ md: '0.5' }}
                    minWidth={{ md: '3em' }}
                  >
                    <Text fontWeight="semibold">
                      <Trans>Domain:</Trans>
                    </Text>
                    <Text isTruncated>{mergedScan.domain}</Text>
                  </Box>
                  <Stack
                    flexDirection={{ base: 'column', md: 'row' }}
                    flexGrow={{ base: 0, md: '1' }}
                  >
                    <Box ml={{ md: 2 }} mr={{ md: 2 }}>
                      <Stack
                        align="center"
                        flexDirection={{ base: 'row', md: 'column' }}
                        justifyContent="space-between"
                        spacing={0}
                      >
                        <Text
                          fontWeight="bold"
                          fontSize="sm"
                          mb={{ base: 0, md: '2' }}
                          mr={{ base: '2', md: 0 }}
                        >
                          HTTPS:
                        </Text>
                        {mergedScan.scan.https ? (
                          generateStatusIcon(mergedScan.scan.https.status)
                        ) : (
                          <Spinner color="accent" size="icons.sm" />
                        )}
                      </Stack>
                    </Box>
                    <Box ml={{ md: 2 }} mr={{ md: 2 }}>
                      <Stack
                        align="center"
                        flexDirection={{ base: 'row', md: 'column' }}
                        justifyContent="space-between"
                        spacing={0}
                      >
                        <Text
                          fontWeight="bold"
                          fontSize="sm"
                          mb={{ base: 0, md: '2' }}
                          mr={{ base: '2', md: 0 }}
                        >
                          SSL:
                        </Text>
                        {mergedScan.scan.ssl ? (
                          generateStatusIcon(mergedScan.scan.ssl.status)
                        ) : (
                          <Spinner color="accent" size="icons.sm" />
                        )}
                      </Stack>
                    </Box>
                    <Box ml={{ md: 2 }} mr={{ md: 2 }}>
                      <Stack
                        align="center"
                        flexDirection={{ base: 'row', md: 'column' }}
                        justifyContent="space-between"
                        spacing={0}
                      >
                        <Text
                          fontWeight="bold"
                          fontSize="sm"
                          mb={{ base: 0, md: '2' }}
                          mr={{ base: '2', md: 0 }}
                        >
                          SPF:
                        </Text>
                        {mergedScan.scan.spf ? (
                          generateStatusIcon(mergedScan.scan.spf.status)
                        ) : (
                          <Spinner color="accent" size="icons.sm" />
                        )}
                      </Stack>
                    </Box>
                    <Box ml={{ md: 2 }} mr={{ md: 2 }}>
                      <Stack
                        align="center"
                        flexDirection={{ base: 'row', md: 'column' }}
                        justifyContent="space-between"
                        spacing={0}
                      >
                        <Text
                          fontWeight="bold"
                          fontSize="sm"
                          mb={{ base: 0, md: '2' }}
                          mr={{ base: '2', md: 0 }}
                        >
                          DKIM:
                        </Text>
                        {mergedScan.scan.dkim ? (
                          generateStatusIcon(mergedScan.scan.dkim.status)
                        ) : (
                          <Spinner color="accent" size="icons.sm" />
                        )}
                      </Stack>
                    </Box>
                    <Box ml={{ md: 2 }} mr={{ md: 2 }}>
                      <Stack
                        align="center"
                        flexDirection={{ base: 'row', md: 'column' }}
                        justifyContent="space-between"
                        spacing={0}
                      >
                        <Text
                          fontWeight="bold"
                          fontSize="sm"
                          mb={{ base: 0, md: '2' }}
                          mr={{ base: '2', md: '0' }}
                        >
                          DMARC:
                        </Text>
                        {mergedScan.scan.dmarc ? (
                          generateStatusIcon(mergedScan.scan.dmarc.status)
                        ) : (
                          <Spinner color="accent" size="icons.sm" />
                        )}
                      </Stack>
                    </Box>
                    <Divider
                      orientation={{ base: 'horizontal', md: 'vertical' }}
                      alignSelf="stretch"
                    />
                  </Stack>
                </Flex>
              </PseudoBox>
              <Collapse isOpen={openScanIndex === index}>
                <Tabs isFitted>
                  <TabList mb="4">
                    <Tab>
                      <Trans>Web Guidance</Trans>
                    </Tab>
                    <Tab>
                      <Trans>Email Guidance</Trans>
                    </Tab>
                  </TabList>
                  <TabPanels>
                    <TabPanel>
                      <Box
                        bg="white"
                        rounded="lg"
                        overflow="hidden"
                        boxShadow="medium"
                        pb="1"
                      >
                        <Box bg="primary" color="gray.50">
                          <Stack px="3" py="1">
                            <Heading as="h1" size="lg">
                              <Trans>Web Scan Results</Trans>
                            </Heading>
                            <Text fontSize={['md', 'lg']}>
                              <Trans>
                                Results for scans of web technologies (SSL,
                                HTTPS).
                              </Trans>
                            </Text>
                          </Stack>
                        </Box>
                        <Box>
                          <Stack spacing="30px" px="1" mt="1">
                            <Box pb="1">
                              {mergedScan.scan.https && mergedScan.scan.ssl ? (
                                mergedScan.scan.https.status === 'PASS' &&
                                mergedScan.scan.ssl.status === 'PASS' ? (
                                  <Stack isInline align="center" px="2">
                                    <Icon
                                      name="check-circle"
                                      color="strong"
                                      size="icons.md"
                                    />
                                    <Text fontWeight="bold" fontSize="2xl">
                                      <Trans>ITPIN Compliant</Trans>
                                    </Text>
                                  </Stack>
                                ) : (
                                  <Stack isInline align="center" px="2">
                                    <Icon
                                      name="warning-2"
                                      color="moderate"
                                      size="icons.md"
                                    />
                                    <Text fontWeight="bold" fontSize="2xl">
                                      <Trans>
                                        Changes Required for ITPIN Compliance
                                      </Trans>
                                    </Text>
                                  </Stack>
                                )
                              ) : (
                                <Stack isInline align="center" px="2">
                                  <Spinner color="accent" size="icons.md" />
                                  <Text fontWeight="bold" fontSize="2xl">
                                    <Trans>Loading Compliance Status</Trans>
                                  </Text>
                                </Stack>
                              )}
                            </Box>
                            {mergedScan?.scan.https && (
                              <ScanCategoryDetails
                                categoryName="https"
                                categoryData={mergedScan.scan.https}
                              />
                            )}
                            {mergedScan?.scan.ssl && (
                              <ScanCategoryDetails
                                categoryName="ssl"
                                categoryData={mergedScan.scan.ssl}
                              />
                            )}
                          </Stack>
                        </Box>
                      </Box>
                    </TabPanel>

                    <TabPanel>
                      <Box
                        bg="white"
                        rounded="lg"
                        overflow="hidden"
                        boxShadow="medium"
                        pb="1"
                      >
                        <Box bg="primary" color="gray.50">
                          <Stack px="3" py="1">
                            <Heading as="h1" size="lg">
                              <Trans>Email Scan Results</Trans>
                            </Heading>
                            <Text fontSize={['md', 'lg']}>
                              <Trans>
                                Results for scans of email technologies (DMARC,
                                SPF, DKIM).
                              </Trans>
                            </Text>
                          </Stack>
                        </Box>
                        <Box>
                          <Stack spacing="30px" px="1" mt="1">
                            <Box pb="1">
                              {mergedScan.scan.dmarc ? (
                                <Box pb="1">
                                  <Stack isInline align="center" px="2">
                                    <Text fontWeight="bold" fontSize="2xl">
                                      <Trans>
                                        DMARC Implementation Phase:{' '}
                                        {mergedScan.scan.dmarc.dmarcPhase
                                          ? mergedScan.scan.dmarc.dmarcPhase.toUpperCase()
                                          : 'UNKNOWN'}
                                      </Trans>
                                    </Text>
                                  </Stack>
                                  {mergedScan.scan.dmarc.dmarcPhase &&
                                    mergedScan.scan.dmarc.dmarcPhase !==
                                      'not implemented' && (
                                      <Box bg="gray.100" px="2" py="1">
                                        {dmarcSteps[
                                          mergedScan.scan.dmarc.dmarcPhase
                                        ].map((step, index) => (
                                          <Text key={index}>
                                            {index + 1}. {step}
                                          </Text>
                                        ))}
                                      </Box>
                                    )}
                                </Box>
                              ) : (
                                <Stack isInline align="center" px="2">
                                  <Spinner color="accent" size="icons.md" />
                                  <Text fontWeight="bold" fontSize="2xl">
                                    <Trans>Loading DMARC Phase</Trans>
                                  </Text>
                                </Stack>
                              )}
                            </Box>
                            {mergedScan?.scan.dkim && (
                              <ScanCategoryDetails
                                categoryName="dkim"
                                categoryData={mergedScan.scan.dkim}
                              />
                            )}
                            {mergedScan?.scan.dmarc && (
                              <ScanCategoryDetails
                                categoryName="dmarc"
                                categoryData={mergedScan.scan.dmarc}
                              />
                            )}
                            {mergedScan?.scan.spf && (
                              <ScanCategoryDetails
                                categoryName="spf"
                                categoryData={mergedScan.scan.spf}
                              />
                            )}
                          </Stack>
                        </Box>
                      </Box>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </Collapse>
              <PseudoBox
                as={Flex}
                width="100%"
                justifyContent="center"
                onClick={() => {
                  if (openScanIndex === index) {
                    setOpenScanIndex(-1)
                    return
                  }

                  setOpenScanIndex(index)
                }}
                _hover={{ bg: ['', 'gray.100'] }}
                role="button"
              >
                <Icon
                  name={`${
                    openScanIndex === index ? 'chevron-up' : 'chevron-down'
                  }`}
                  size="icons.lg"
                />
              </PseudoBox>
              <Divider />
            </React.Fragment>
          )
        })}
      </Stack>
    </Box>
  )
}
