import React from 'react'
import { Box, Divider, Heading, Icon, Stack, Text } from '@chakra-ui/react'
import { Trans } from '@lingui/macro'

export default function PageNotFound() {
  return (
    <Box px="2">
      <Stack isInline align="center" justifyContent={['center', 'start']}>
        <Icon name="warning-2" size="icons.xl" />
        <Heading as="h1">
          <Trans>404 - Page Not Found</Trans>
        </Heading>
      </Stack>
      <Divider />
      <Text textAlign="center" fontSize="2xl" fontWeight="bold">
        <Trans>The page you are looking for has moved or does not exist.</Trans>
      </Text>
    </Box>
  )
}
