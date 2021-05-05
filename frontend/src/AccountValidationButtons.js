import React, { useState } from 'react'
import { bool, string } from 'prop-types'
import { Stack, useToast } from '@chakra-ui/core'
import { useMutation } from '@apollo/client'
import { Trans, t } from '@lingui/macro'
import { SEND_EMAIL_VERIFICATION } from './graphql/mutations'

import { TrackerButton } from './TrackerButton'

export default function AccountValidationButtons({
  userName,
  phoneNumber,
  emailValidated,
  phoneValidated,
}) {
  const toast = useToast()
  const [emailSent, setEmailSent] = useState(false)
  const [textSent, setTextSent] = useState(false)
  const [sendEmailVerification, { error }] = useMutation(
    SEND_EMAIL_VERIFICATION,
    {
      onError() {
        toast({
          title: error.message,
          description: t`Unable to send verification email`,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      },
      onCompleted() {
        toast({
          title: t`Email successfully sent`,
          description: t`Check your associated Tracker email for the verification link`,
          status: 'success',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
        setEmailSent(true)
      },
    },
  )

  return (
    <Stack isInline align="center">
      {!emailValidated && (
        <TrackerButton
          variant="primary"
          onClick={() => {
            if (!emailSent)
              sendEmailVerification({ variables: { userName: userName } })
          }}
        >
          <Trans>Verify Email</Trans>
        </TrackerButton>
      )}
      {!phoneValidated && phoneNumber !== null && (
        <TrackerButton
          variant="primary"
          onClick={() => {
            if (!textSent) {
              window.alert(phoneNumber)
              setTextSent(true)
            }
          }}
        >
          <Trans>Verify Phone Number</Trans>
        </TrackerButton>
      )}
    </Stack>
  )
}

AccountValidationButtons.propTypes = {
  userName: string,
  phoneNumber: string,
  emailValidated: bool,
  phoneValidated: bool,
}
