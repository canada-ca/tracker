import React from 'react'
import { useField } from 'formik'
import { string } from 'prop-types'
import { Stack, Select, FormControl, FormErrorMessage } from '@chakra-ui/core'
import { useLingui } from '@lingui/react'
import { t, Trans } from '@lingui/macro'

export function LanguageSelect({ name, ...props }) {
  const [field, meta] = useField(name)
  const { i18n } = useLingui()
  return (
    <FormControl mt={4} mb={4} isRequired>
      <Stack>
        <Select
          {...props}
          {...field}
          id="lang"
          // placeholder={i18n._(t`Select Preferred Language`)}
        >
          <option hidden value="">
            {i18n._(t`Select Preferred Language`)}
          </option>
          <option value="ENGLISH">English</option>
          <option value="FRENCH">Français</option>
        </Select>
      </Stack>

      <FormErrorMessage>
        <Trans>{meta.error}</Trans>
      </FormErrorMessage>
    </FormControl>
  )
}

LanguageSelect.propTypes = {
  name: string.isRequired,
}
