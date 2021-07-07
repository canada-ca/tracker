import React, { useState } from 'react'
import { t, Trans } from '@lingui/macro'
import { i18n } from '@lingui/core'
import { TrackerButton } from './TrackerButton'
import { Formik } from 'formik'
import {
  Box,
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
            <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
              <ScanCard scanType="web" scanData={webScan} status={webStatus} />
            </ErrorBoundary>
          </TabPanel>
          <TabPanel>
            <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
              <ScanCard
                scanType="email"
                scanData={emailScan}
                status={dmarcPhase}
              />
            </ErrorBoundary>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  )
}
