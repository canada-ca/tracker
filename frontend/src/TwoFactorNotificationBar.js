import React from 'react'
import { Box, Flex, Link, Text } from '@chakra-ui/react'
import { Link as RouteLink } from 'react-router-dom'
import { Trans } from '@lingui/macro'

export function TwoFactorNotificationBar() {
  return (
    <Box bg="yellow.250" p="2">
      <Flex layerStyles="pageLayout" flex="1 0 auto">
        <Text fontWeight="medium">
          <Trans>
            You have not enabled Two Factor Authentication. To maximize your
            account's security,{' '}
            <Link
              textDecoration="underline"
              as={RouteLink}
              to="/two-factor-code"
            >
              please enable 2FA
            </Link>
            .
          </Trans>
        </Text>
      </Flex>
    </Box>
  )
}
