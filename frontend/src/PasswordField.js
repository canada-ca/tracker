import React from 'react'
import { string } from 'prop-types'
import { useLingui } from '@lingui/react'
import { t } from '@lingui/macro'
import {
  FormControl,
  Input,
  InputGroup,
  InputRightElement,
  InputLeftElement,
  Icon,
  FormErrorMessage,
  Button,
} from '@chakra-ui/core'
import { useField } from 'formik'
import WithPseudoBox from './withPseudoBox.js'

function PasswordField({ name, ...props }) {
  const [field, meta] = useField(name)
  const [show, setShow] = React.useState(false)
  const { i18n } = useLingui()
  const handleClick = () => setShow(!show)

  return (
    <FormControl isInvalid={meta.error && meta.touched}>
      <InputGroup size="md">
        <InputLeftElement>
          <Icon name="lock" color="gray.300" />
        </InputLeftElement>

        <Input
          {...field}
          {...props}
          pr="4.5rem"
          type={show ? 'text' : 'password'}
          placeholder={i18n._(t`Password`)}
          id="password"
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
}

export default WithPseudoBox(PasswordField)
