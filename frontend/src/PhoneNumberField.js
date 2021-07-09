import React from 'react'
import { lazyWithRetry } from './LazyWithRetry'
import { string } from 'prop-types'
import { useLingui } from '@lingui/react'
import { Trans } from '@lingui/macro'
import { Box, FormControl, FormErrorMessage, FormLabel } from '@chakra-ui/core'
import { useField, useFormikContext } from 'formik'
import WithWrapperBox from './WithWrapperBox'
import { fieldRequirements } from './fieldRequirements'
const PhoneInput = lazyWithRetry(() => import('react-phone-input-2'))

const PhoneNumberField = WithWrapperBox(function PhoneNumberField({
  name,
  label,
}) {
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
            autoFocus: true,
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
})

PhoneNumberField.propTypes = {
  name: string.isRequired,
  label: string.isRequired,
}

export default PhoneNumberField
