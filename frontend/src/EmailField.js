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
} from '@chakra-ui/core'
import { useField } from 'formik'
import WithPseudoBox, { withPseudoBoxPropTypes } from './withPseudoBox'

function EmailField({ name, ...props }) {
  const [field, meta] = useField(name)
  const { i18n } = useLingui()

  return (
    <FormControl {...props} isInvalid={meta.error && meta.touched}>
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
      </InputGroup>

      <FormErrorMessage>{meta.error}</FormErrorMessage>
    </FormControl>
  )
}

EmailField.propTypes = {
  ...withPseudoBoxPropTypes,
  name: string.isRequired,
}

export default WithPseudoBox(EmailField)
