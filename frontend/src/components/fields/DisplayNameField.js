import React from 'react'
import { func, object, oneOfType, shape } from 'prop-types'
import { t } from '@lingui/macro'
import { PersonIcon } from '../../theme/Icons'

import { FormField } from './FormField'

function DisplayNameField({ forwardedRef, inputProps, ...props }) {
  return (
    <FormField
      name="displayName"
      label={t`Display Name:`}
      leftElement={<PersonIcon color="gray.300" size="icons.lg" />}
      placeholder={t`Display Name`}
      ref={forwardedRef}
      inputProps={inputProps}
      {...props}
    />
  )
}

DisplayNameField.propTypes = {
  inputProps: object,
  forwardedRef: oneOfType([func, shape({ current: object })]),
}

const withForwardedRef = React.forwardRef((props, ref) => {
  return <DisplayNameField {...props} forwardedRef={ref} />
})
withForwardedRef.displayName = 'DisplayNameField'

export { withForwardedRef as DisplayNameField }
