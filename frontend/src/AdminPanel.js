import React from 'react'
import { Stack, SimpleGrid, useToast } from '@chakra-ui/core'
import UserList from './UserList'
import { string } from 'prop-types'
import { slugify } from './slugify'
import { ADMIN_PANEL } from './graphql/queries'
import { useQuery } from '@apollo/client'
import { useUserState } from './UserState'
import { AdminDomains } from './AdminDomains'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'
import { LoadingMessage } from './LoadingMessage'
import { Trans } from '@lingui/macro'

export default function AdminPanel({ orgName, permission }) {
  const { currentUser } = useUserState()
  const toast = useToast()

  // TODO: combine these queries into a single request
  const { loading, error, data, refetch } = useQuery(ADMIN_PANEL, {
    variables: { slug: slugify(orgName) },
    context: {
      headers: {
        authorization: currentUser.jwt,
      },
    },
    onError: (error) => {
      const [_, message] = error.message.split(': ')
      toast({
        title: 'Error',
        description: message,
        status: 'failure',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    },
  })

  if (loading) {
    return (
      <LoadingMessage>
        <Trans>Organization Info</Trans>
      </LoadingMessage>
    )
  }
  // Current api returns an error if no domains found
  // TODO: Remove includes check when api is ready
  if (error && !error.includes('Error, unable to find domains')) {
    return <ErrorFallbackMessage error={error} />
  }

  return (
    <Stack spacing={10}>
      <SimpleGrid columns={{ lg: 2 }} spacing="60px" width="100%">
        <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
          <AdminDomains
            domainsData={data.domains}
            orgName={orgName}
            refetchFunc={refetch}
          />
        </ErrorBoundary>
        <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
          <UserList
            permission={permission}
            userListData={data.userList}
            orgName={orgName}
            orgSlug={slugify(orgName)}
          />
        </ErrorBoundary>
      </SimpleGrid>
    </Stack>
  )
}

AdminPanel.propTypes = {
  orgName: string,
  permission: string,
}
