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

function DisplayNameField({ name, rightInputElement, label, ...props }) {
  const [field, meta] = useField(name)
  const { i18n } = useLingui()

  const formLabel = label === undefined ? <Trans>Display Name:</Trans> : label

  return (
    <FormControl isInvalid={meta.error && meta.touched}>
      <FormLabel htmlFor="displayName" fontWeight="bold">
        {formLabel}
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
        {rightInputElement}
      </InputGroup>

      <FormErrorMessage>{meta.error}</FormErrorMessage>
    </FormControl>
  )
}

DisplayNameField.propTypes = {
  name: string.isRequired,
  rightInputElement: element,
}

export default WithPseudoBox(DisplayNameField)
