import React from 'react'
import { useLingui } from '@lingui/react'
import { string } from 'prop-types'
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

export function PasswordField({ name, ...props }) {
  const { i18n } = useLingui()
  const [field, meta] = useField(name)
  const [show, setShow] = React.useState(false)
  const handleClick = () => setShow(!show)

  return (
    <FormControl isInvalid={meta.error && meta.touched}>
      <InputGroup size="md">
        <InputLeftElement>
          <Icon name="lock" color="gray.300" />
        </InputLeftElement>

        <Input
          {...props}
          {...field}
          isInvalid={meta.error}
          pr="4.5rem"
          type={show ? 'text' : 'password'}
          placeholder="Password"
          id="password"
        />
        <InputRightElement width="4.5rem">
          <Button id="showButton" h="1.75rem" size="sm" onClick={handleClick}>
            {show ? i18n._('Hide') : i18n._('Show')}
          </Button>
        </InputRightElement>
      </InputGroup>
      <FormErrorMessage>{meta.error}</FormErrorMessage>
    </FormControl>
  )
}

PasswordField.propTypes = { name: string.isRequired }
