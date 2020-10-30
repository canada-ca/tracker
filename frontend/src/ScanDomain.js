import React from 'react'
import { Trans, t } from '@lingui/macro'
import { TrackerButton } from './TrackerButton'
import { Formik } from 'formik'
import { Stack, Box, Input, Text } from '@chakra-ui/core'
import { useLingui } from '@lingui/react'

function scan(values) {
  window.alert(`Scanning ${values.domain}. . . `)
}

export function ScanDomain({ submitScan = scan }) {
  const { i18n } = useLingui()
  return (
    <Box px="8" mx="auto" overflow="hidden">
      <Formik initialValues={{ domain: '' }} onSubmit={submitScan}>
        {({ handleSubmit, handleChange, values, isSubmitting }) => {
          return (
            <form
              onSubmit={handleSubmit}
              role="form"
              aria-label="form"
              name="form"
            >
              <Text fontSize="2xl" mb="2">
                <Trans>Perform a one-time scan on a domain:</Trans>
              </Text>
              <Stack flexDirection={['column', 'row']} alignContent="center">
                <Input
                  width={['100%', '70%']}
                  mb="8px"
                  mr="4"
                  type="text"
                  onChange={handleChange}
                  placeholder={i18n._(t`Enter a domain`)}
                  value={values.domain}
                  name="domain"
                  id="domain"
                />
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
              </Stack>
            </form>
          )
        }}
      </Formik>
    </Box>
  )
}
