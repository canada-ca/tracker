import React from 'react'
import { Stack, SimpleGrid, Text } from '@chakra-ui/core'
import { Trans } from '@lingui/macro'
import UserList from './UserList'
import DomainsPage from './DomainsPage'
import { string } from 'prop-types'

export default function AdminPanel({ ...props }) {
  const { name } = props

  return (
    <Stack spacing={10}>
      <Stack spacing={4}>
        <Text fontSize="3xl" fontWeight="bold">
          {name}
        </Text>
      </Stack>
      <SimpleGrid columns={{ lg: 2 }} spacing="60px" width="100%">
        <DomainsPage />
        <UserList />
      </SimpleGrid>
    </Stack>
  )
}

AdminPanel.propTypes = {
  name: string,
}
