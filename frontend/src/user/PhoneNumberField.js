import React from 'react'
import { lazyWithRetry } from '../utilities/lazyWithRetry'
import { string } from 'prop-types'
import { useLingui } from '@lingui/react'
import { Trans } from '@lingui/macro'
import { Box, FormControl, FormErrorMessage, FormLabel } from '@chakra-ui/react'
import { useField, useFormikContext } from 'formik'
import { fieldRequirements } from '../utilities/fieldRequirements'
const PhoneInput = lazyWithRetry(() => import('react-phone-input-2'))

export function PhoneNumberField({ name, label }) {
  const [, meta] = useField(name)
  const { values, setFieldValue } = useFormikContext()
  const { i18n } = useLingui()

  const labelText = label === undefined ? <Trans>Phone Number:</Trans> : label

  const errorText =
    meta.error !== i18n._(fieldRequirements.phoneNumber.matches.message) ? (
      <FormErrorMessage>{meta.error}</FormErrorMessage>
    ) : (
      ''
    )

  return (
    <FormControl isInvalid={meta.error && meta.touched}>
      <FormLabel htmlFor="phoneNumber" fontWeight="bold">
        {labelText}
      </FormLabel>
      <br />
      <Box display="inline-block" border="2px" borderColor="gray.200">
        <PhoneInput
          inputProps={{
            id: name,
            name: name,
            autoFocus: false,
          }}
          value={values[name]}
          onChange={(e) => setFieldValue(name, e)}
          type="phoneNumber"
          specialLabel={null}
          country={'ca'}
        />
      </Box>

      {errorText}
    </FormControl>
  )
}

PhoneNumberField.propTypes = {
  name: string.isRequired,
  label: string.isRequired,
}
