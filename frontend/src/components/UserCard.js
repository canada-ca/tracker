import React from 'react'
import { Badge, Flex, Text } from '@chakra-ui/react'
import { any, string } from 'prop-types'

export function UserCard({ userName, displayName, role, children, ...props }) {
  return (
    <Flex px="2" py="3" align="center" rounded="md" mb="2" borderColor="black" borderWidth="1px" {...props}>
      {children}
      <Text fontSize="lg" fontWeight="bold" wordBreak="break-all" ml={{ md: '1rem' }}>
        {displayName} ({userName})
      </Text>
      {role && (
        <Badge
          ml="auto"
          variant="solid"
          bg={role === 'USER' ? 'primary' : role === 'ADMIN' ? 'info' : role === 'PENDING' ? 'strong' : 'weak'}
          pt={1}
          mr={{ md: '1rem' }}
          justifySelf={{ base: 'start', md: 'end' }}
        >
          {role}
        </Badge>
      )}
    </Flex>
  )
}

UserCard.propTypes = {
  userName: string.isRequired,
  displayName: string,
  role: string,
  children: any,
}
