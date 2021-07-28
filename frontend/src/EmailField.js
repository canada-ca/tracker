import React from 'react'
import { func, object, oneOfType, shape, string } from 'prop-types'
import { useLingui } from '@lingui/react'
import { t, Trans } from '@lingui/macro'
import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react'
import { EmailIcon } from '@chakra-ui/icons'
import { useField } from 'formik'

function EmailField({ name, label, forwardedRef, ...props }) {
  const [field, meta] = useField(name)
  const { i18n } = useLingui()

  const labelText = label === undefined ? <Trans>Email:</Trans> : label

  return (
    <FormControl isInvalid={meta.error && meta.touched}>
      <FormLabel htmlFor="email" fontWeight="bold">
        {labelText}
      </FormLabel>
      <InputGroup>
        <InputLeftElement aria-hidden="true">
          <EmailIcon color="gray.300" />
        </InputLeftElement>
        <Input
          {...field}
          {...props}
          id="email"
          type="email"
          ref={forwardedRef}
          placeholder={i18n._(t`Email`)}
          variant="outline"
        />
      </InputGroup>

      <FormErrorMessage>{meta.error}</FormErrorMessage>
    </FormControl>
  )
}

EmailField.propTypes = {
  name: string.isRequired,
  label: string,
  forwardedRef: oneOfType([func, shape({ current: object })]),
}

const withForwardedRef = React.forwardRef((props, ref) => {
  return <EmailField {...props} forwardedRef={ref} />
})
withForwardedRef.displayName = 'EmailField'

export default withForwardedRef
