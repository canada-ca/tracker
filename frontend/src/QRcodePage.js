import React from 'react'
import { Trans } from '@lingui/macro'
import { Box, Stack, Text, Button } from '@chakra-ui/core'
import { useHistory } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { useUserState } from './UserState'
import { GENERATE_OTP_URL } from './graphql/queries'
import QRCode from 'qrcode.react'

export default function QRcodePage() {
  const { currentUser } = useUserState()
  const history = useHistory()

  // This function generates the URL when the page loads
  const { loading, error, data } = useQuery(GENERATE_OTP_URL, {
    variables: { email: currentUser.userName },
  })

  if (loading)
    return (
      <p>
        <Trans>Loading...</Trans>
      </p>
    )
  if (error) return <p>Error: {error.message} </p>

  if (data)
    return (
      <Stack spacing={4} mx="auto" alignItems="center">
        <Text alignItems="center" mx="auto" fontSize="2xl">
          <Trans>
            Scan this QR code with a 2FA app like Authy or Google Authenticator
          </Trans>
        </Text>

        <Box mt={6} mx="auto">
          <QRCode
            role="img"
            renderAs="svg"
            value={String(data.generateOtpUrl)}
            size={256}
          />
        </Box>

        <Text mt={6} alignItems="center" mx="auto" fontSize="lg">
          <Trans>
            Your 2FA app will then have a valid code that you can use when you
            sign in.
          </Trans>
        </Text>

        <Stack spacing={4} isInline>
          <Button
            color="blue.900"
            bg="transparent"
            borderColor="blue.900"
            borderWidth="1px"
            onClick={history.goBack}
          >
            <Trans>Back</Trans>
          </Button>
        </Stack>
      </Stack>
    )
}
