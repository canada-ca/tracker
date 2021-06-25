import React from 'react'
import { Badge, Box, PseudoBox, Stack, Text } from '@chakra-ui/core'
import { string } from 'prop-types'

export function UserCard({ userName, displayName, role }) {
  return (
    <PseudoBox width="100%" p="8">
      <Stack isInline align="center" mb={['1', '0']}>
        <Box width="50%">
          <Text fontSize="md" wordBreak="break-all">
            {userName}
          </Text>
        </Box>
        <Box width="40%">{displayName}</Box>
        <Box width="10%">
          {role && (
            <Badge
              color="primary"
              bg="transparent"
              borderColor="primary"
              borderWidth="1px"
              ml="auto"
            >
              {role}
            </Badge>
          )}
        </Box>
      </Stack>
    </PseudoBox>
  )
}

UserCard.propTypes = {
  userName: string.isRequired,
  displayName: string,
  role: string,
}
