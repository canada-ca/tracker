import React from 'react'
import { Flex, Text, Box } from '@chakra-ui/react'
import { Trans } from '@lingui/macro'
import { WarningTwoIcon } from '@chakra-ui/icons'

export function MFANotificationBar() {
  return (
    <Box bg="blue.200" p="2">
      <Flex
        maxW={{ sm: 540, md: 768, lg: 960, xl: 1200 }}
        flex="1 0 auto"
        mx="auto"
        px={4}
        width="100%"
        justifyContent="center"
        align="center"
      >
        <WarningTwoIcon color="yellow.250" mr="2" />
        <Text fontWeight="medium">
          <Trans>
            Admin accounts must activate a multi-factor authentication option
          </Trans>
        </Text>
      </Flex>
    </Box>
  )
}
