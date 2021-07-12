import React, { useState } from 'react'
import { t, Trans } from '@lingui/macro'
import { i18n } from '@lingui/core'
import { TrackerButton } from './TrackerButton'
import { Formik } from 'formik'
import {
  Box,
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
} from '@chakra-ui/core'
import { REQUEST_SCAN } from './graphql/mutations'
import {
  useApolloClient,
  useMutation,
  useQuery,
  useSubscription,
} from '@apollo/client'
import { LoadingMessage } from './LoadingMessage'
import { fieldRequirements } from './fieldRequirements'
import { object, string } from 'yup'
import DomainField from './DomainField'
import { DKIM_SCAN_DATA, DMARC_SCAN_DATA } from './graphql/subscriptions'
import {
  GET_ONE_TIME_DKIM_SCANS,
  GET_ONE_TIME_DMARC_SCANS,
  GET_ONE_TIME_HTTPS_SCANS,
  GET_ONE_TIME_SCANS,
  GET_ONE_TIME_SPF_SCANS,
  GET_ONE_TIME_SSL_SCANS,
} from './graphql/queries'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'
import ScanCard from './ScanCard'
import ScanCategoryDetails from './ScanCategoryDetails'

export function ScanDomain() {
  const toast = useToast()
  const validationSchema = object().shape({
    domain: string().required(
      i18n._(fieldRequirements.domainUrl.required.message),
    ),
  })
  const [requestSent, setRequestSent] = useState(false)

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
        })
      } else {
        // matching merged scan found, merge current scan with it
        mergedScans[mergedScanMatchIndex].scan[curScanType] = scan
      }
    })
  }

  // TODO: Create list of collapsable scan detail cards

  console.log({ mergedScans })

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
                <Text fontSize="2xl" mb="2" textAlign={['center', 'left']}>
                  <Trans>Request a domain to be scanned:</Trans>
                </Text>
                <DomainField name="domain" mb="4" />

                <TrackerButton
                  w={['100%', '25%']}
                  variant="primary"
                  isLoading={isSubmitting}
                  type="submit"
                  id="submitBtn"
                  fontSize="lg"
                >
                  <Trans>Scan Domain</Trans>
                </TrackerButton>
              </Box>
            </form>
          )
        }}
      </Formik>
      <Stack>
        {mergedScans.map((mergedScan, index) => {
          return (
            <Tabs key={`one-time-scan-index:${index}`} isFitted>
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
                            Results for scans of web technologies (SSL, HTTPS).
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
                            Results for scans of email technologies (DMARC, SPF,
                            DKIM).
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
                {/*<TabPanel>*/}
                {/*  <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>*/}
                {/*    <ScanCard scanType="web" scanData={webScan} status={webStatus} />*/}
                {/*  </ErrorBoundary>*/}
                {/*</TabPanel>*/}
                {/*<TabPanel>*/}
                {/*  <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>*/}
                {/*    <ScanCard*/}
                {/*      scanType="email"*/}
                {/*      scanData={emailScan}*/}
                {/*      status={dmarcPhase}*/}
                {/*    />*/}
                {/*  </ErrorBoundary>*/}
                {/*</TabPanel>*/}
              </TabPanels>
            </Tabs>
          )
        })}
      </Stack>
    </Box>
  )
}
