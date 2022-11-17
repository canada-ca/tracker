import React from 'react'
import { string } from 'prop-types'
import { Spinner } from '@chakra-ui/react'
import { CheckCircleIcon, WarningIcon, InfoIcon } from '@chakra-ui/icons'

export function StatusIcon({ status, ...props }) {
  if (status === 'PASS') {
    return (
      <CheckCircleIcon
        color="strong"
        size="icons.sm"
        aria-label="passes"
        {...props}
      />
    )
  } else if (status === 'FAIL') {
    return (
      <WarningIcon color="weak" size="icons.sm" aria-label="fails" {...props} />
    )
  } else if (status === 'LOADING') {
    return <Spinner color="accent" size="sm" {...props} />
  } else {
    return (
      <InfoIcon
        color="info"
        size="icons.sm"
        aria-label="Information not sufficient, please view guidance"
        {...props}
      />
    )
  }
}

StatusIcon.propTypes = {
  status: string.isRequired,
}
