import React, { useState, useEffect } from 'react'
import { Trans, t } from '@lingui/macro'
import { Heading, useToast, Text, Stack, Icon, Divider } from '@chakra-ui/core'
import { useParams } from 'react-router-dom'
import { useMutation } from '@apollo/client'
import { VERIFY_ACCOUNT } from './graphql/mutations'
import { LoadingMessage } from './LoadingMessage'

export default function EmailValidationPage() {
  const toast = useToast()
  const { verifyToken } = useParams()
  const [success, setSuccess] = useState(false)

  const [verifyAccount, { loading }] = useMutation(VERIFY_ACCOUNT, {
    onError(error) {
      toast({
        title: error.message,
        description: t`Unable to validate email`,
        status: 'error',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    },
    onCompleted({ verifyAccount }) {
      if (verifyAccount.result.__typename === 'VerifyAccountResult') {
        toast({
          title: t`Account verified`,
          description: t`Your account email is now validated`,
          status: 'success',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
        setSuccess(true)
      } else if (verifyAccount.result.__typename === 'VerifyAccountError') {
        toast({
          title: t`Unable to verify your account email, please try again.`,
          description: verifyAccount.result.description,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      } else {
        toast({
          title: t`Incorrect send method received.`,
          description: t`Incorrect verifyAccount.result typename.`,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
        console.log('Incorrect verifyAccount.result typename.')
      }
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
          <Text fontSize="xl">
            <Trans>Your account email was successfully verified</Trans>
          </Text>
        </Stack>
      )
    } else {
      return (
        <Stack isInline align="center">
          <Icon name="warning" color="weak" />
          <Text fontSize="xl">
            <Trans>
              Your account email could not be verified at this time. Please try
              again.
            </Trans>
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
    </Stack>
  )
}
