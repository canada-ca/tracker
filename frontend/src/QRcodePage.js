import React from 'react'
import { Trans } from '@lingui/macro'
import PropTypes from 'prop-types'
import { Box, Stack, Text, Button } from '@chakra-ui/core'
import { Link as RouteLink } from 'react-router-dom'
import { useQuery } from '@apollo/react-hooks'
import { GENERATE_OTP_URL } from './graphql/queries'
import QRCode from 'qrcode.react'

export function QRcodePage({ userName }) {
  // This function generates the URL when the page loads
  const { loading, error, data } = useQuery(GENERATE_OTP_URL, {
    variables: { userName: userName },
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
            width={{ md: 40 }}
            as={RouteLink}
            to="/sign-in"
            variantColor="teal"
          >
            <Trans>Sign In</Trans>
          </Button>
          <Button
            width={{ md: 40 }}
            as={RouteLink}
            to="/"
            variantColor="teal"
            variant="outline"
          >
            <Trans>Home</Trans>
          </Button>
        </Stack>
      </Stack>
    )
}

QRcodePage.propTypes = {
  userName: PropTypes.string.isRequired,
}
