import React from 'react'
import { Trans, t } from '@lingui/macro'
import { TrackerButton } from './TrackerButton'
import { Formik } from 'formik'
import { Stack, Box, Text, Select, useToast } from '@chakra-ui/core'
import { REQUEST_SCAN } from './graphql/mutations'
import { slugify } from './slugify'
import { useMutation } from '@apollo/client'
import { LoadingMessage } from './LoadingMessage'
import { fieldRequirements } from './fieldRequirements'
import { object, string } from 'yup'
import DomainField from './DomainField'

export function ScanDomain() {
  const toast = useToast()
  const validationSchema = object().shape({
    domain: string().required(fieldRequirements.domainUrl.required.message),
  })
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

  if (loading) return <LoadingMessage />

  return (
    <Box px="8" mx="auto" overflow="hidden">
      <Formik
        validationSchema={validationSchema}
        initialValues={{ domain: '', scanType: null }}
        onSubmit={async (values) => {
          requestScan({
            variables: {
              urlSlug: slugify(values.domain),
              scanType: values.scanType,
            },
          })
        }}
      >
        {({ handleSubmit, values, isSubmitting }) => {
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
                <DomainField width={['100%', '75%']} name="domain" mb="4" />
                <Stack mb="4">
                  <Text fontWeight="bold">Scan Type:</Text>
                  <Select
                    aria-label={t`Select scan type`}
                    width={['100%', '25%']}
                    onChange={(e) => (values.scanType = e.target.value)}
                  >
                    <option value="WEB">{t`WEB`}</option>
                    <option value="MAIL">{t`MAIL`}</option>
                  </Select>
                </Stack>

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
