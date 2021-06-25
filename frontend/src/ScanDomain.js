import React, { useState } from 'react'
import { t, Trans } from '@lingui/macro'
import { i18n } from '@lingui/core'
import { TrackerButton } from './TrackerButton'
import { Formik } from 'formik'
import { Box, Text, useToast } from '@chakra-ui/core'
import { REQUEST_SCAN } from './graphql/mutations'
import { useMutation, useSubscription } from '@apollo/client'
import { LoadingMessage } from './LoadingMessage'
import { fieldRequirements } from './fieldRequirements'
import { object, string } from 'yup'
import DomainField from './DomainField'
import { DKIM_SCAN_DATA } from './graphql/subscriptions'

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
  const {
    data: subscriptionData,
    loading: subscriptionLoading,
    error: subscriptionError,
  } = useSubscription(DKIM_SCAN_DATA, {
    skip: !requestSent,
  })

  if (loading) return <LoadingMessage />

  return (
    <Box px="2" mx="auto" overflow="hidden">
      <Formik
        validationSchema={validationSchema}
        initialValues={{ domain: '' }}
        onSubmit={async (values) => {
          requestScan({
            variables: {
              domainUrl: values.domain,
            },
          })
        }}
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
    </Box>
  )
}
