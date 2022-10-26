import React from 'react'
import { t, Trans } from '@lingui/macro'
import { Formik } from 'formik'
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Divider,
  Flex,
  Heading,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useToast,
} from '@chakra-ui/react'
import { WarningTwoIcon } from '@chakra-ui/icons'
import { useMutation, useQuery } from '@apollo/client'

import { DomainField } from '../components/fields/DomainField'
import { StatusBadge } from './StatusBadge'

import { ScanDetails } from '../guidance/ScanDetails'
import { LoadingMessage } from '../components/LoadingMessage'
import { StatusIcon } from '../components/StatusIcon'
import { createValidationSchema } from '../utilities/fieldRequirements'
import { GET_ONE_TIME_SCANS } from '../graphql/queries'
import { REQUEST_SCAN } from '../graphql/mutations'

export function ScanDomain() {
  const toast = useToast()

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

  const statusGroupingProps = {
    flexDirection: { base: 'column', md: 'row' },
    border: '1px solid',
    borderColor: 'gray.300',
    borderRadius: 'md',
    px: { base: 2, md: 0 },
    py: { base: 1, md: 2 },
    mx: { base: 0, md: 1 },
    my: { base: 2, md: 0 },
    bg: 'gray.100',
  }

  return (
    <Box px="2" mx="auto" overflow="hidden">
      <Formik
        validationSchema={createValidationSchema(['domainUrl'])}
        initialValues={{ domainUrl: '' }}
        onSubmit={async (values) =>
          requestScan({
            variables: {
              domainUrl: values.domainUrl.toLowerCase(),
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
                <DomainField name="domainUrl" mb="4" />

                <Button
                  w={{ base: '100%', md: '25%' }}
                  variant="primary"
                  isLoading={isSubmitting}
                  type="submit"
                  name="submitBtn"
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
      <Accordion allowMultiple defaultIndex={[]} mt={4}>
        {mergedScans.reverse().map((mergedScan, index) => {
          return (
            <AccordionItem key={index} mb={8} borderRadius="sm">
              <h2>
                <AccordionButton
                  width="100%"
                  p="4"
                  pl={{ md: '8' }}
                  alignItems={{ base: 'flex-start', md: 'center' }}
                  flexDirection={{ base: 'column', md: 'row' }}
                  textAlign="left"
                  fontWeight="inherit"
                  bg="gray.100"
                  _hover={{ bg: ['', 'gray.300'] }}
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
                  <Flex
                    flexDirection={{ base: 'column', md: 'row' }}
                    flexGrow={{ base: 0, md: '1' }}
                  >
                    <Flex {...statusGroupingProps}>
                      <StatusBadge
                        text="HTTPS:"
                        status={
                          mergedScan.scan?.https
                            ? mergedScan.scan.https.status
                            : 'LOADING'
                        }
                      />
                      <StatusBadge
                        text="TLS:"
                        status={
                          mergedScan.scan?.ssl
                            ? mergedScan.scan.ssl.status
                            : 'LOADING'
                        }
                      />
                    </Flex>
                    <Flex {...statusGroupingProps}>
                      <StatusBadge
                        text="SPF:"
                        status={
                          mergedScan.scan?.spf
                            ? mergedScan.scan.spf.status
                            : 'LOADING'
                        }
                      />
                      <StatusBadge
                        text="DKIM:"
                        status={
                          mergedScan.scan?.dkim
                            ? mergedScan.scan.dkim.status
                            : 'LOADING'
                        }
                      />
                      <StatusBadge
                        text="DMARC:"
                        status={
                          mergedScan.scan?.dmarc
                            ? mergedScan.scan.dmarc.status
                            : 'LOADING'
                        }
                      />
                    </Flex>
                    <Divider
                      orientation={{ base: 'horizontal', md: 'vertical' }}
                      alignSelf="stretch"
                    />
                  </Flex>
                </AccordionButton>
              </h2>
              <AccordionPanel>
                <Tabs isFitted variant="enclosed-colored">
                  <TabList mb="4">
                    <Tab borderTopWidth="4px">
                      <Trans>Web Guidance</Trans>
                    </Tab>
                    <Tab borderTopWidth="4px">
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
                                Results for scans of web technologies (TLS,
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
                                    <StatusIcon status="PASS" />
                                    <Text fontWeight="bold" fontSize="2xl">
                                      <Trans>ITPIN Compliant</Trans>
                                    </Text>
                                  </Stack>
                                ) : (
                                  <Stack isInline align="center" px="2">
                                    <WarningTwoIcon
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
                                <LoadingMessage>One Time Scan</LoadingMessage>
                              )}
                            </Box>
                            <Accordion allowMultiple defaultIndex={[0, 1]}>
                              {mergedScan?.scan.https && (
                                <ScanDetails
                                  categoryName="https"
                                  categoryData={mergedScan.scan.https}
                                />
                              )}
                              {mergedScan?.scan.ssl && (
                                <ScanDetails
                                  categoryName="TLS"
                                  categoryData={mergedScan.scan.ssl}
                                />
                              )}
                            </Accordion>
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
                                <LoadingMessage>One Time Scan</LoadingMessage>
                              )}
                            </Box>
                            <Accordion allowMultiple defaultIndex={[0, 1, 2]}>
                              {mergedScan?.scan.dkim && (
                                <ScanDetails
                                  categoryName="dkim"
                                  categoryData={mergedScan.scan.dkim}
                                />
                              )}
                              {mergedScan?.scan.dmarc && (
                                <ScanDetails
                                  categoryName="dmarc"
                                  categoryData={mergedScan.scan.dmarc}
                                />
                              )}
                              {mergedScan?.scan.spf && (
                                <ScanDetails
                                  categoryName="spf"
                                  categoryData={mergedScan.scan.spf}
                                />
                              )}
                            </Accordion>
                          </Stack>
                        </Box>
                      </Box>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </AccordionPanel>

              <h2>
                <AccordionButton
                  justifyContent="center"
                  bg="gray.100"
                  _hover={{ bg: ['', 'gray.300'] }}
                >
                  <AccordionIcon />
                </AccordionButton>
              </h2>
            </AccordionItem>
          )
        })}
      </Accordion>
    </Box>
  )
}
