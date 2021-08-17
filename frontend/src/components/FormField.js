import React from 'react'
import { elementType, func, object, oneOfType, shape, string } from 'prop-types'
import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react'
import { useField } from 'formik'

function FormField({
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
    <FormControl isInvalid={meta.error && meta.touched} {...props}>
      <FormLabel htmlFor={name} fontWeight="bold">
        {labelText}
      </FormLabel>
      <InputGroup>
        {leftElement && (
          <InputLeftElement aria-hidden="true">{leftElement}</InputLeftElement>
        )}
        <Input
          {...field}
          id={id || name}
          type={type}
          ref={forwardedRef}
          placeholder={placeholder || ''}
        />
      </InputGroup>

      <FormErrorMessage>{meta.error}</FormErrorMessage>
    </FormControl>
  )
}

FormField.propTypes = {
  name: string.isRequired,
  id: string,
  label: string,
  type: string,
  placeholder: string,
  leftElement: elementType,
  forwardedRef: oneOfType([func, shape({ current: object })]),
}

const withForwardedRef = React.forwardRef((props, ref) => {
  return <FormField {...props} forwardedRef={ref} />
})
withForwardedRef.displayName = 'FormField'

export { withForwardedRef as FormField }
