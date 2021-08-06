import React from 'react'
import { Flex, Text, Box, Link } from '@chakra-ui/react'
import { Link as RouteLink } from 'react-router-dom'
import { Trans } from '@lingui/macro'

export function TwoFactorNotificationBar() {
  return (
    <Box bg="yellow.250" p="2">
      <Flex
        maxW={{ sm: 540, md: 768, lg: 960, xl: 1200 }}
        flex="1 0 auto"
        mx="auto"
        px={4}
        width="100%"
      >
        <Text fontWeight="medium">
          <Trans>
            To enable full app functionality and maximize your account's
            security,{' '}
            <Link textDecoration="underline" as={RouteLink} to="/user">
              please verify your account
            </Link>
            .
          </Trans>
        </Text>
      </Flex>
    </Box>
  )
}
