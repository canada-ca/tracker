import React from 'react'
import { Badge, Grid, Text } from '@chakra-ui/react'
import { string } from 'prop-types'

export function UserCard({ userName, displayName, role, ...props }) {
  return (
    <Grid
      templateColumns={{ base: 'auto', md: '45% auto auto' }}
      columnGap="1.5rem"
      {...props}
    >
      <Text fontSize="md" wordBreak="break-all" ml={{ md: '1rem' }}>
        {userName}
      </Text>
      <Text>{displayName}</Text>
      {role && (
        <Badge
          color="primary"
          bg="transparent"
          borderColor="primary"
          borderWidth="1px"
          alignSelf={{ md: 'center' }}
          mr={{ md: '1rem' }}
          justifySelf={{ base: 'start', md: 'end' }}
        >
          {role}
        </Badge>
      )}
    </Grid>
  )
}

UserCard.propTypes = {
  userName: string.isRequired,
  displayName: string,
  role: string,
}
