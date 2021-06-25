import React from 'react'
import { useField } from 'formik'
import { string } from 'prop-types'
import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  Select,
} from '@chakra-ui/core'
import { t, Trans } from '@lingui/macro'
import WithPseudoBox from './withPseudoBox'

function LanguageSelect({ name, ...props }) {
  const [field, meta] = useField(name)

  return (
    <FormControl isInvalid={meta.error && meta.touched}>
      <FormLabel htmlFor="lang" fontWeight="bold">
        <Trans>Language:</Trans>
      </FormLabel>
      <Select {...field} {...props} id="lang">
        <option hidden value="">
          {t`Select Preferred Language`}
        </option>
        <option value="ENGLISH">English</option>
        <option value="FRENCH">Français</option>
      </Select>
      <FormErrorMessage>{meta.error}</FormErrorMessage>
    </FormControl>
  )
}

LanguageSelect.propTypes = {
  name: string.isRequired,
}
export default WithPseudoBox(LanguageSelect)
