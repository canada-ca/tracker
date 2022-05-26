import React from 'react'
import {
  element,
  func,
  object,
  oneOfType,
  shape,
  string,
  oneOf,
} from 'prop-types'
import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Stack,
} from '@chakra-ui/react'
import { useField } from 'formik'

function FormField({
  name,
  label,
  forwardedRef,
  type,
  align,
  placeholder,
  leftElement,
  rightElement,
  useFieldInput,
  inputProps,
  autoComplete,
  ...props
}) {
  const [field, meta] = useField(useFieldInput || name)

  return (
    <FormControl isInvalid={meta.error && meta.touched} {...props}>
      <Stack align={align}>
        <FormLabel htmlFor={name} fontWeight="bold">
          {label || ''}
        </FormLabel>
        <InputGroup width={align === 'center' ? 'fit-content' : '100%'}>
          {leftElement && (
            <InputLeftElement aria-hidden="true">
              {leftElement}
            </InputLeftElement>
          )}
          <Input
            name={name}
            id={name}
            type={type || 'text'}
            ref={forwardedRef}
            placeholder={placeholder || ''}
            autoComplete={autoComplete}
            {...field}
            {...inputProps}
            borderColor="black"
          />
          {rightElement && (
            <InputRightElement>{rightElement}</InputRightElement>
          )}
        </InputGroup>

        <FormErrorMessage mt={0}>{meta.error}</FormErrorMessage>
      </Stack>
    </FormControl>
  )
}

FormField.propTypes = {
  name: string.isRequired,
  label: string,
  type: string,
  align: string,
  placeholder: string,
  leftElement: element,
  rightElement: element,
  inputProps: object,
  useFieldInput: object,
  forwardedRef: oneOfType([func, shape({ current: object })]),
  autoComplete: oneOf(['on', 'off']),
}

FormField.defaultProps = {
  align: 'left',
}

const withForwardedRef = React.forwardRef((props, ref) => {
  return <FormField {...props} forwardedRef={ref} />
})
withForwardedRef.displayName = 'FormField'

export { withForwardedRef as FormField }
