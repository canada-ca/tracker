import React from 'react'
import { string } from 'prop-types'
import {
  FormControl,
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
  FormErrorMessage,
} from '@chakra-ui/core'
import { useField } from 'formik'

export function EmailField({ name, ...props }) {
  const [field, meta] = useField(name)
  return (
    <FormControl mt={4} mb={4} isInvalid={meta.error && meta.touched}>
      <InputGroup>
        <InputLeftElement>
          <Icon name="email" color="gray.300" />
        </InputLeftElement>
        <Input {...props} {...field} id="email" placeholder="Email" />
      </InputGroup>

      <FormErrorMessage>{meta.error}</FormErrorMessage>
    </FormControl>
  )
}

EmailField.propTypes = {
  name: string.isRequired,
}
