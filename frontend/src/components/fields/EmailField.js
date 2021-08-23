import React from 'react'
import { func, object, oneOfType, shape } from 'prop-types'
import { t } from '@lingui/macro'
import { EmailIcon } from '@chakra-ui/icons'

import { FormField } from './FormField'

function EmailField({ forwardedRef, inputProps, ...props }) {
  return (
    <FormField
      name="email"
      label={t`Email:`}
      leftElement={<EmailIcon color="gray.300" />}
      type="email"
      placeholder={t`Email`}
      ref={forwardedRef}
      inputProps={inputProps}
      {...props}
    />
  )
}

EmailField.propTypes = {
  inputProps: object,
  forwardedRef: oneOfType([func, shape({ current: object })]),
}

const withForwardedRef = React.forwardRef((props, ref) => {
  return <EmailField {...props} forwardedRef={ref} />
})
withForwardedRef.displayName = 'EmailField'

export { withForwardedRef as EmailField }
