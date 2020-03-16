import React from 'react'
import { Flex, Text, Box, Link } from '@chakra-ui/core'
import { Link as RouteLink } from 'react-router-dom'

export function TwoFactorNotificationBar() {
  return (
    <Box bg="tomato" p={2}>
      <Flex
        maxW={{ sm: 540, md: 768, lg: 960, xl: 1200 }}
        flex="1 0 auto"
        mx="auto"
        width="100%"
      >
        <Text>
          You have not enabled Two Factor Authentication. To maximize your
          account&lsquo;s security, <Link textDecoration="underline" as={RouteLink} to="/two-factor-code">please enable 2FA</Link>.
        </Text>
      </Flex>
    </Box>
  )
}
