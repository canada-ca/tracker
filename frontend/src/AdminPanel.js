import React from 'react'
import { Stack, SimpleGrid } from '@chakra-ui/core'
import { string } from 'prop-types'
import { AdminDomains } from './AdminDomains'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'
import UserList from './UserList'

export default function AdminPanel({ orgSlug, permission }) {
  return (
    <Stack spacing={10}>
      <SimpleGrid columns={{ lg: 2 }} spacing="60px" width="100%">
        <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
          <AdminDomains orgSlug={orgSlug} domainsPerPage={4} />
        </ErrorBoundary>
        <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
          <UserList
            permission={permission}
            orgSlug={orgSlug}
            usersPerPage={4}
          />
        </ErrorBoundary>
      </SimpleGrid>
    </Stack>
  )
}

AdminPanel.propTypes = {
  orgSlug: string.isRequired,
  permission: string.isRequired,
}
