import React from 'react'
import { string } from 'prop-types'
import { useLingui } from '@lingui/react'
import { t, Trans } from '@lingui/macro'
import {
  FormControl,
  Input,
  InputGroup,
  InputRightElement,
  InputLeftElement,
  Icon,
  FormErrorMessage,
  Button,
  FormLabel,
} from '@chakra-ui/core'
import { useField } from 'formik'
import WithPseudoBox from './withPseudoBox.js'

function PasswordField({ name, label, ...props }) {
  const [field, meta] = useField(name)
  const [show, setShow] = React.useState(false)
  const { i18n } = useLingui()
  const handleClick = () => setShow(!show)

  const labelText = label === undefined ? <Trans>Password:</Trans> : label

  return (
    <FormControl isInvalid={meta.error && meta.touched}>
      <FormLabel htmlFor={name} fontWeight="bold">
        {labelText}
      </FormLabel>
      <InputGroup size="md">
        <InputLeftElement>
          <Icon name="lock" color="gray.300" />
        </InputLeftElement>

        <Input
          pr="4.5rem"
          type={show ? 'text' : 'password'}
          placeholder={i18n._(t`Password`)}
          id={name}
          {...field}
          {...props}
        />
        <InputRightElement width="4.5rem">
          <Button id="showButton" h="1.75rem" size="sm" onClick={handleClick}>
            <Icon name={show ? 'view-off' : 'view'} />
          </Button>
        </InputRightElement>
      </InputGroup>
      <FormErrorMessage>{meta.error}</FormErrorMessage>
    </FormControl>
  )
}

PasswordField.propTypes = {
  name: string.isRequired,
  label: string,
}

export default WithPseudoBox(PasswordField)
