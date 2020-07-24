import React from 'react'
import { element, string } from 'prop-types'
import { useLingui } from '@lingui/react'
import { t, Trans } from '@lingui/macro'
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

function EmailField({ name, rightInputElement, label, ...props }) {
  const [field, meta] = useField(name)
  const { i18n } = useLingui()

  const labelText = label === undefined ? <Trans>Password:</Trans> : label

  return (
    <FormControl isInvalid={meta.error && meta.touched}>
      <FormLabel htmlFor="email" fontWeight="bold">
        {labelText}
      </FormLabel>
      <InputGroup>
        <InputLeftElement>
          <Icon name="email" color="gray.300" />
        </InputLeftElement>
        <Input
          {...field}
          {...props}
          id="email"
          placeholder={i18n._(t`Email`)}
        />
        {rightInputElement}
      </InputGroup>

      <FormErrorMessage>{meta.error}</FormErrorMessage>
    </FormControl>
  )
}

EmailField.propTypes = {
  name: string.isRequired,
  rightInputElement: element,
}

export default WithPseudoBox(EmailField)
