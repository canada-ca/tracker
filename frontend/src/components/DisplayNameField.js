import React from 'react'
import { func, object, oneOfType, shape, string } from 'prop-types'
import { t, Trans } from '@lingui/macro'
import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react'
import { PersonIcon } from '../theme/Icons'
import { useField } from 'formik'

function DisplayNameField({ name, label, forwardedRef, ...props }) {
  const [field, meta] = useField(name)

  const formLabel = label === undefined ? <Trans>Display Name:</Trans> : label

  return (
    <FormControl isInvalid={meta.error && meta.touched} {...props}>
      <FormLabel htmlFor="displayName" fontWeight="bold">
        {formLabel}
      </FormLabel>
      <InputGroup>
        <InputLeftElement aria-hidden="true">
          <PersonIcon color="gray.300" size="icons.lg" />
        </InputLeftElement>
        <Input
          aria-label="input-display-name"
          {...field}
          ref={forwardedRef}
          id="displayName"
          placeholder={t`Display Name`}
        />
      </InputGroup>

      <FormErrorMessage>{meta.error}</FormErrorMessage>
    </FormControl>
  )
}

DisplayNameField.propTypes = {
  name: string.isRequired,
  label: string,
  forwardedRef: oneOfType([func, shape({ current: object })]),
}

const withForwardedRef = React.forwardRef((props, ref) => {
  return <DisplayNameField {...props} forwardedRef={ref} />
})
withForwardedRef.displayName = 'DisplayNameField'

export { withForwardedRef as DisplayNameField }
