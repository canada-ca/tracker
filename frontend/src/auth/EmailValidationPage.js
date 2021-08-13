import React, { useEffect, useState } from 'react'
import { Trans } from '@lingui/macro'
import { Button, Divider, Stack, Text } from '@chakra-ui/react'
import {
  ArrowForwardIcon,
  CheckCircleIcon,
  WarningIcon,
} from '@chakra-ui/icons'
import { Link as RouteLink, useParams } from 'react-router-dom'
import { useMutation } from '@apollo/client'

import { LoadingMessage } from '../components/LoadingMessage'
import { VERIFY_ACCOUNT } from '../graphql/mutations'

export default function EmailValidationPage() {
  const { verifyToken } = useParams()
  const [success, setSuccess] = useState(false)
  let errorMessage = ''

  const [verifyAccount, { loading }] = useMutation(VERIFY_ACCOUNT, {
    onError(error) {
      errorMessage = error.message
    },
    onCompleted({ verifyAccount }) {
      if (verifyAccount.result.__typename === 'VerifyAccountResult')
        setSuccess(true)
      else if (verifyAccount.result.__typename === 'VerifyAccountError')
        errorMessage = verifyAccount.result.description
      else console.log('Incorrect verifyAccount.result typename.')
    },
  })

  useEffect(() => {
    verifyAccount({ variables: { verifyToken: verifyToken } })
  }, [verifyAccount, verifyToken])

  const verifyMessage = () => {
    if (success) {
      return (
        <Stack>
          <Stack isInline align="center">
            <CheckCircleIcon color="strong" />
            <Text fontSize="2xl" textAlign="center" fontWeight="bold">
              <Trans>Your account email was successfully verified</Trans>
            </Text>
          </Stack>
          <Text fontSize="xl" textAlign="center">
            <Trans>
              Your account will be fully activated the next time you log in
            </Trans>
          </Text>
        </Stack>
      )
    } else {
      return (
        <Stack>
          <Stack isInline align="center">
            <WarningIcon color="weak" />
            <Text fontSize="2xl" textAlign="center" fontWeight="bold">
              <Trans>
                Your account email could not be verified at this time. Please
                try again.
              </Trans>
            </Text>
          </Stack>
          <Text fontSize="xl" textAlign="center">
            {errorMessage}
          </Text>
        </Stack>
      )
    }
  }

  return (
    <Stack px="8" mx="auto" overflow="hidden" align="center">
      {loading ? <LoadingMessage /> : verifyMessage()}
      <Divider />
      {!loading && (
        <Button
          as={RouteLink}
          to="/"
          color="primary"
          bg="transparent"
          borderColor="primary"
          borderWidth="1px"
          rightIcon={<ArrowForwardIcon />}
        >
          <Trans>Continue</Trans>
        </Button>
      )}
    </Stack>
  )
}
