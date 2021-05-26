import React from 'react'
import { elementType, func, oneOfType, shape, string } from 'prop-types'
import { FormControl, FormErrorMessage, Input } from '@chakra-ui/core'
import { useField } from 'formik'
import WithPseudoBox from './withPseudoBox'

const AcronymField = WithPseudoBox(function AcronymField({
  name,
  placeholder,
  forwardedRef,
  ...props
}) {
  const [field, meta] = useField(name)

  return (
    <FormControl isInvalid={meta.error && meta.touched} isRequired>
      <Input
        {...field}
        {...props}
        id={name}
        name={name}
        ref={forwardedRef}
        placeholder={placeholder}
      />
      <FormErrorMessage>{meta.error}</FormErrorMessage>
    </FormControl>
  )
})

AcronymField.propTypes = {
  name: string.isRequired,
  forwardedRef: oneOfType([func, shape({ current: elementType })]),
}

const withForwardedRef = React.forwardRef((props, ref) => {
  return <AcronymField {...props} forwardedRef={ref} />
})
withForwardedRef.displayName = 'AcronymField'

export default withForwardedRef
