import React from 'react'
import { Badge, Box, Text, PseudoBox, Stack } from '@chakra-ui/core'
import { string } from 'prop-types'

export function UserCard({ userName, role }) {
  return (
    <PseudoBox width="100%" p="8">
      <Stack isInline align="center" mb={['1', '0']}>
        <Box>
          <Text fontSize="md">{userName}</Text>
        </Box>
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
      </Stack>
    </PseudoBox>
  )
}

UserCard.propTypes = {
  userName: string.isRequired,
  role: string,
}
