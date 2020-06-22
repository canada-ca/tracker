import React from 'react'
import { Stack, SimpleGrid, Text, useToast } from '@chakra-ui/core'
import { Trans } from '@lingui/macro'
import UserList from './UserList'
import { DomainList } from './DomainList'
import { string } from 'prop-types'
import { slugify } from './slugify'
import { QUERY_USERLIST, DOMAINS } from './graphql/queries'
import { useQuery } from '@apollo/react-hooks'
import { useUserState } from './UserState'

export default function AdminPanel({ ...props }) {
  const { orgName } = props
  const { currentUser } = useUserState()
  const toast = useToast()

  const {
    loading: domainsLoading,
    error: domainsError,
    data: domainsData,
  } = useQuery(DOMAINS, {
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
      })
    },
  })

  const {
    loading: userListLoading,
    error: userListError,
    data: userListData,
  } = useQuery(QUERY_USERLIST, {
    context: {
      headers: {
        authorization: currentUser.jwt,
      },
    },
    variables: {
      slug: slugify(currentUser.userName),
    },
  })

  if (userListLoading) {
    return <p>Loading user list...</p>
  }
  if (userListError) {
    return <p>{String(userListError)}</p>
  }

  if (domainsLoading) {
    return <p>Loading domains...</p>
  }
  if (domainsError) {
    return <p>{String(domainsError)}</p>
  }

  return (
    <Stack spacing={10}>
      <SimpleGrid columns={{ lg: 2 }} spacing="60px" width="100%">
        <DomainList data={domainsData} orgName={orgName} />
        <UserList data={userListData} orgName={orgName} />
      </SimpleGrid>
    </Stack>
  )
}

AdminPanel.propTypes = {
  orgName: string,
}
