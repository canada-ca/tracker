import React from 'react'
import { Stack, SimpleGrid, useToast } from '@chakra-ui/core'
import UserList from './UserList'
import { string } from 'prop-types'
import { slugify } from './slugify'
import { ADMIN_PANEL } from './graphql/queries'
import { useQuery } from '@apollo/client'
import { useUserState } from './UserState'
import { AdminDomains } from './AdminDomains'

export default function AdminPanel({ orgName }) {
  const { currentUser } = useUserState()
  const toast = useToast()

  // TODO: combine these queries into a single request
  const { loading, error, data } = useQuery(ADMIN_PANEL, {
    variables: { slug: slugify(orgName) },
    context: {
      headers: {
        authorization: currentUser.jwt,
      },
    },
    onError: error => {
      const [_, message] = error.message.split(': ')
      toast({
        title: 'Error',
        description: message,
        status: 'failure',
        duration: 9000,
        isClosable: true,
      })
    },
  })

  if (loading) {
    return <p>Loading...</p>
  }
  if (error) {
    return <p>{String(error)}</p>
  }

  return (
    <Stack spacing={10}>
      <SimpleGrid columns={{ lg: 2 }} spacing="60px" width="100%">
        <AdminDomains domainsData={data.domains} orgName={orgName} />
        <UserList name="admin" userListData={data.userList} orgName={orgName} />
      </SimpleGrid>
    </Stack>
  )
}

AdminPanel.propTypes = {
  orgName: string,
}
