import React from 'react'
import { Badge, Box, Text, PseudoBox } from '@chakra-ui/core'
import { string } from 'prop-types'

export function UserCard({ userName, displayName, role }) {
  return (
    <PseudoBox width="100%" p="8">
      <Box
        align="center"
        mb={['1', '0']}
        width="100%"
      >
        <Box
          width={{sm:"100%", md:"50%"}}
          display={{sm:"block", md:"inline-block"}}
          align={{sm:"left", md:"center"}}
        >
          <Text fontSize="md" wordBreak="break-all">
            {userName}
          </Text>
        </Box>
        <Box
          width={{sm:"100%", md:"40%"}}
          display={{sm:"block", md:"inline-block"}}
          align={{sm:"left", md:"center"}}
        >
          {displayName}
        </Box>
        <Box
          width={{sm:"100%", md:"10%"}}
          display={{sm:"block", md:"inline-block"}}
          align={{sm:"left", md:"center"}}
        >
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
      </Box>
    </PseudoBox>
  )
}

UserCard.propTypes = {
  userName: string.isRequired,
  displayName: string,
  role: string,
}
