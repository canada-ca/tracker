import React from 'react'
import { string } from 'prop-types'
import { useLingui } from '@lingui/react'
import { t } from '@lingui/macro'
import {
  FormControl,
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
  FormErrorMessage,
  FormLabel,
} from '@chakra-ui/core'
import { useField } from 'formik'
import WithPseudoBox from './withPseudoBox'

function DisplayNameField({ name, ...props }) {
  const [field, meta] = useField(name)
  const { i18n } = useLingui()

  return (
    <FormControl isInvalid={meta.error && meta.touched}>
      <FormLabel htmlFor="displayName" fontWeight="bold">
        Display Name:
      </FormLabel>
      <InputGroup>
        <InputLeftElement>
          <Icon name="person" color="gray.300" size="1.5rem" />
        </InputLeftElement>
        <Input
          {...field}
          {...props}
          id="displayName"
          placeholder={i18n._(t`Display Name`)}
        />
      </InputGroup>

      <FormErrorMessage>{meta.error}</FormErrorMessage>
    </FormControl>
  )
}

DisplayNameField.propTypes = {
  name: string.isRequired,
}

export default WithPseudoBox(DisplayNameField)
