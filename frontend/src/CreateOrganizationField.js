import React from 'react'
import { elementType, func, oneOfType, shape, string } from 'prop-types'
import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
} from '@chakra-ui/react'
import { useField } from 'formik'
import WithWrapperBox from './WithWrapperBox'

const OrganizationCreateField = WithWrapperBox(
  function OrganizationCreateField({
    name,
    label,
    language,
    forwardedRef,
    ...props
  }) {
    const [field, meta] = useField(name)

    return (
      <FormControl isInvalid={meta.error && meta.touched}>
        <FormLabel htmlFor={name} fontWeight="bold">
          {label} ({language})
        </FormLabel>
        <Input
          {...field}
          {...props}
          id={name}
          name={name}
          ref={forwardedRef}
          placeholder={`${label} (${language})`}
        />
        <FormErrorMessage>{meta.error}</FormErrorMessage>
      </FormControl>
    )
  },
)

OrganizationCreateField.propTypes = {
  name: string.isRequired,
  forwardedRef: oneOfType([func, shape({ current: elementType })]),
}

const withForwardedRef = React.forwardRef((props, ref) => {
  return <OrganizationCreateField {...props} forwardedRef={ref} />
})
withForwardedRef.displayName = 'OrganizationCreateField'

export default withForwardedRef
