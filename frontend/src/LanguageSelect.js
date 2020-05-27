import React from 'react'
import { useField } from 'formik'
import { string } from 'prop-types'
import { Stack, Select, FormControl, FormErrorMessage } from '@chakra-ui/core'
import { useLingui } from '@lingui/react'
import { t } from '@lingui/macro'

export function LanguageSelect({ name, ...props }) {
  const [field, meta] = useField(name)
  const { i18n } = useLingui()

  return (
    <FormControl {...props} isInvalid={meta.error && meta.touched}>
      <Stack>
        <Select {...field} id="lang">
          <option hidden value="">
            {i18n._(t`Select Preferred Language`)}
          </option>
          <option value="ENGLISH">English</option>
          <option value="FRENCH">Français</option>
        </Select>
      </Stack>

      <FormErrorMessage>{meta.error}</FormErrorMessage>
    </FormControl>
  )
}

LanguageSelect.propTypes = {
  name: string.isRequired,
}
