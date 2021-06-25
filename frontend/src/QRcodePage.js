import React from 'react'
import { Trans } from '@lingui/macro'
import { Box, Button, Stack, Text } from '@chakra-ui/core'
import { useHistory } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { useUserVar } from './UserState'
import { GENERATE_OTP_URL } from './graphql/queries'
import QRCode from 'qrcode.react'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'
import { LoadingMessage } from './LoadingMessage'

export default function QRcodePage() {
  const { currentUser } = useUserVar()
  const history = useHistory()

  // This function generates the URL when the page loads
  const { loading, error, data } = useQuery(GENERATE_OTP_URL, {
    variables: { email: currentUser.userName },
  })

  if (loading)
    return (
      <LoadingMessage>
        <Trans>QR Code</Trans>
      </LoadingMessage>
    )
  if (error) return <ErrorFallbackMessage error={error} />

  if (data)
    return (
      <Stack spacing="4" mx="auto" alignItems="center" px="8" overflow="hidden">
        <Text textAlign="center" mx="auto" fontSize="2xl">
          <Trans>
            Scan this QR code with a 2FA app like Authy or Google Authenticator
          </Trans>
        </Text>

        <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
          <Box mt={6} mx="auto">
            <QRCode
              role="img"
              renderAs="svg"
              value={String(data.generateOtpUrl)}
              size={256}
            />
          </Box>
        </ErrorBoundary>

        <Text mt="6" textAlign="center" mx="auto" fontSize="lg">
          <Trans>
            Your 2FA app will then have a valid code that you can use when you
            sign in.
          </Trans>
        </Text>

        <Stack spacing={4} isInline>
          <Button
            color="primary"
            bg="transparent"
            borderColor="primary"
            borderWidth="1px"
            mb="4"
            onClick={history.goBack}
          >
            <Trans>Back</Trans>
          </Button>
        </Stack>
      </Stack>
    )
}
