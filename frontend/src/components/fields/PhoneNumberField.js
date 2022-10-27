import React from 'react'
import { string } from 'prop-types'
import { Trans } from '@lingui/macro'
import { Box, FormControl, FormErrorMessage, FormLabel } from '@chakra-ui/react'
import { useField, useFormikContext } from 'formik'
import PhoneInput from 'react-phone-input-2'

export function PhoneNumberField({ name, label }) {
  const [, meta] = useField(name)
  const { values, setFieldValue } = useFormikContext()

  const labelText = label === undefined ? <Trans>Phone Number:</Trans> : label

  return (
    <FormControl isInvalid={meta.error && meta.touched}>
      <FormLabel htmlFor="phoneNumber" fontWeight="bold">
        {labelText}
      </FormLabel>
      <Box display="inline-block" border="2px" borderColor="gray.200" w="100%">
        <PhoneInput
          inputProps={{
            id: name,
            name: name,
            autoFocus: false,
            style: {
              width: '100%',
              padding: '8px',
              paddingInlineStart: '20px',
            },
          }}
          value={values[name]}
          onChange={(e) => setFieldValue(name, e)}
          type="phoneNumber"
          specialLabel={null}
          country={'ca'}
        />
      </Box>

      <FormErrorMessage>{meta.error}</FormErrorMessage>
    </FormControl>
  )
}

PhoneNumberField.propTypes = {
  name: string.isRequired,
  label: string.isRequired,
}
