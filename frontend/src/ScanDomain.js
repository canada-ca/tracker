import React from 'react'
import { Trans, t } from '@lingui/macro'
import { i18n } from '@lingui/core'
import { TrackerButton } from './TrackerButton'
import { Formik } from 'formik'
import { Box, Text, useToast } from '@chakra-ui/core'
import { REQUEST_SCAN } from './graphql/mutations'
import { useMutation } from '@apollo/client'
import { LoadingMessage } from './LoadingMessage'
import { fieldRequirements } from './fieldRequirements'
import { object, string } from 'yup'
import DomainField from './DomainField'
import { useUserState } from './UserState'

export function ScanDomain() {
  const toast = useToast()
  const { currentUser } = useUserState()
  const validationSchema = object().shape({
    domain: string().required(
      i18n._(fieldRequirements.domainUrl.required.message),
    ),
  })
  const [requestScan, { loading }] = useMutation(REQUEST_SCAN, {
    context: {
      headers: {
        authorization: currentUser.jwt,
      },
    },
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
                <DomainField name="domain" mb="4" isDisabled={true} />

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
