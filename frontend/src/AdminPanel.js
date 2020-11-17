import React from 'react'
import { Stack, SimpleGrid, useToast } from '@chakra-ui/core'
import UserList from './UserList'
import { string } from 'prop-types'
import { slugify } from './slugify'
import { ADMIN_PANEL } from './graphql/queries'
import { useQuery } from '@apollo/client'
import { useUserState } from './UserState'
import { AdminDomains } from './AdminDomains'

export default function AdminPanel({ orgSlug, permission }) {
  const { currentUser } = useUserState()
  const toast = useToast()

  const { loading, error, data, refetch } = useQuery(ADMIN_PANEL, {
    variables: { orgSlug: orgSlug },
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
    return <p>Loading...</p>
  }
  // Current api returns an error if no domains found
  // TODO: Remove includes check when api is ready
  if (error && !error.includes('Error, unable to find domains')) {
    return <p>{String(error)}</p>
  }

  return (
    <Stack spacing={10}>
      <SimpleGrid columns={{ lg: 2 }} spacing="60px" width="100%">
        <AdminDomains
          domainsData={data.findOrganizationBySlug.domains}
          orgId={data.findOrganizationBySlug.id}
          orgSlug={orgSlug}
          refetchFunc={refetch}
        />
        {/* TODO: get user list working */}
        {/* <UserList
          permission={permission}
          userListData={data.userList}
          orgName={orgName}
          orgSlug={slugify(orgName)}
        /> */}
      </SimpleGrid>
    </Stack>
  )
}

AdminPanel.propTypes = {
  orgSlug: string.isRequired,
  permission: string.isRequired,
}
