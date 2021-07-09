import React from 'react'
import { elementType, func, oneOfType, shape, string } from 'prop-types'
import { t, Trans } from '@lingui/macro'
import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  InputGroup,
} from '@chakra-ui/core'
import { useField } from 'formik'
import WithWrapperBox from './WithWrapperBox'

const DomainField = WithWrapperBox(function DomainField({
  name,
  label,
  forwardedRef,
  ...props
}) {
  const [field, meta] = useField(name)

  const labelText = label === undefined ? <Trans>Domain URL:</Trans> : label

  return (
    <FormControl isInvalid={meta.error && meta.touched}>
      <FormLabel htmlFor="email" fontWeight="bold">
        {labelText}
      </FormLabel>
      <InputGroup>
        <Input
          {...field}
          {...props}
          id="domain"
          type="domain"
          ref={forwardedRef}
          placeholder={t`Domain URL`}
        />
      </InputGroup>
      <FormErrorMessage>{meta.error}</FormErrorMessage>
    </FormControl>
  )
})

DomainField.propTypes = {
  name: string.isRequired,
  forwardedRef: oneOfType([func, shape({ current: elementType })]),
}

const withForwardedRef = React.forwardRef((props, ref) => {
  return <DomainField {...props} forwardedRef={ref} />
})
withForwardedRef.displayName = 'DomainField'

export default withForwardedRef
