import React from 'react'
import { elementType, func, oneOfType, shape, string } from 'prop-types'
import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/core'
import { useField } from 'formik'
import WithPseudoBox from './withPseudoBox'

const FormField = WithPseudoBox(function FormField({
  name,
  id,
  label,
  forwardedRef,
  type,
  placeholder,
  leftElement,
  ...props
}) {
  const [field, meta] = useField(name)

  const labelText = label || ''

  return (
    <FormControl isInvalid={meta.error && meta.touched}>
      <FormLabel htmlFor={name} fontWeight="bold">
        {labelText}
      </FormLabel>
      <InputGroup>
        {leftElement && <InputLeftElement>{leftElement}</InputLeftElement>}
        <Input
          {...field}
          {...props}
          id={id || name}
          type={type}
          ref={forwardedRef}
          placeholder={placeholder || ''}
        />
      </InputGroup>

      <FormErrorMessage>{meta.error}</FormErrorMessage>
    </FormControl>
  )
})

FormField.propTypes = {
  name: string.isRequired,
  id: string,
  label: string,
  type: string,
  placeholder: string,
  leftElement: elementType,
  forwardedRef: oneOfType([func, shape({ current: elementType })]),
}

const withForwardedRef = React.forwardRef((props, ref) => {
  return <FormField {...props} forwardedRef={ref} />
})
withForwardedRef.displayName = 'FormField'

export default withForwardedRef
