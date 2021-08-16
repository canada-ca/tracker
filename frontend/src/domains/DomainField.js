import React from 'react'
import { func, object, oneOfType, shape, string } from 'prop-types'
import { t, Trans } from '@lingui/macro'
import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  InputGroup,
} from '@chakra-ui/react'
import { useField } from 'formik'

function DomainField({ name, label, forwardedRef, ...props }) {
  const [field, meta] = useField(name)

  const labelText = label === undefined ? <Trans>Domain URL:</Trans> : label

  return (
    <FormControl isInvalid={meta.error && meta.touched} {...props}>
      <FormLabel htmlFor="email" fontWeight="bold">
        {labelText}
      </FormLabel>
      <InputGroup>
        <Input
          {...field}
          id="domain"
          type="domain"
          ref={forwardedRef}
          placeholder={t`Domain URL`}
        />
      </InputGroup>
      <FormErrorMessage>{meta.error}</FormErrorMessage>
    </FormControl>
  )
}

DomainField.propTypes = {
  name: string.isRequired,
  label: string,
  forwardedRef: oneOfType([func, shape({ current: object })]),
}

const withForwardedRef = React.forwardRef((props, ref) => {
  return <DomainField {...props} forwardedRef={ref} />
})
withForwardedRef.displayName = 'DomainField'

export { withForwardedRef as DomainField }
