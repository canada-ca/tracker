import React, { useEffect, useState } from 'react'
import { Trans } from '@lingui/macro'
import { Button, Divider, Heading, Icon, Stack, Text } from '@chakra-ui/core'
import { Link as RouteLink, useParams } from 'react-router-dom'
import { useMutation } from '@apollo/client'
import { VERIFY_ACCOUNT } from './graphql/mutations'
import { LoadingMessage } from './LoadingMessage'

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
        <Stack isInline align="center">
          <Icon name="check-circle" color="strong" />
          <Text fontSize="xl" textAlign="center">
            <Trans>Your account email was successfully verified</Trans>
          </Text>
        </Stack>
      )
    } else {
      return (
        <Stack>
          <Stack isInline align="center">
            <Icon name="warning" color="weak" />
            <Text fontSize="xl" textAlign="center">
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
      <Heading>
        <Trans>Email Validation Page</Trans>
      </Heading>
      <Divider />
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
          rightIcon="arrow-forward"
        >
          <Trans>Continue</Trans>
        </Button>
      )}
    </Stack>
  )
}
