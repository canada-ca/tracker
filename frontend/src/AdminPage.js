import React from 'react'
import { Stack, SimpleGrid, Text } from '@chakra-ui/core'
import { Trans } from '@lingui/macro'
import UserList from './UserList'
import DomainsPage from './DomainsPage'
import { Layout } from './Layout'
import { QUERY_USER } from './graphql/queries'
import { useUserState } from './UserState'
import { useQuery } from '@apollo/react-hooks'
import AdminPanel from './AdminPanel'

export default function AdminPage() {
  const { currentUser } = useUserState()

  const {
    loading: queryUserLoading,
    error: queryUserError,
    data: queryUserData,
  } = useQuery(QUERY_USER, {
    context: {
      headers: {
        authorization: currentUser.jwt,
      },
    },
    variables: {
      userName: currentUser.userName,
    },
  })

  if (queryUserLoading) {
    return <p>Loading user...</p>
  }

  if (queryUserError) {
    return <p>{String(queryUserError)}</p>
  }

  const affiliations = queryUserData.userPage.userAffiliations
  console.log(affiliations)
  const createAdminPanels = () => {
    const panels = []

    for (let i = 0; i < affiliations.length; i++) {
      if (affiliations[i].admin) {
        panels.push(<AdminPanel org={affiliations[i].organization} />)
      }
    }
    return panels
  }

  return (
    <Layout>
      <Stack spacing={10}>
        <Text fontSize="3xl" fontWeight="bold">
          Welcome, Admin
        </Text>
        {createAdminPanels()}
      </Stack>
    </Layout>
  )
}
