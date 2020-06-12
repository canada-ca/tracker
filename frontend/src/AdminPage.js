import React from 'react'
import { Stack, Text, Select } from '@chakra-ui/core'
import { Trans } from '@lingui/macro'
import { Layout } from './Layout'
import { QUERY_USER } from './graphql/queries'
import { useUserState } from './UserState'
import { useQuery } from '@apollo/react-hooks'
import AdminPanel from './AdminPanel'

export default function AdminPage() {
  const { currentUser } = useUserState()
  const [orgName, setOrgName] = React.useState('')

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

  const createOrgOptions = () => {
    const options = []

    options.push(
      <option hidden value="default">
        Select an organization
      </option>,
    )

    for (let i = 0; i < affiliations.length; i++) {
      if (affiliations[i].admin) {
        options.push(
          <option value={affiliations[i].organization}>
            {affiliations[i].organization}
          </option>,
        )
      }
    }
    return options
  }

  return (
    <Layout>
      <Stack spacing={10}>
        <Text fontSize="3xl" fontWeight="bold">
          Welcome, Admin
        </Text>
        {/* {createOrgOptions().length > 2 && ( */}
        <Stack isInline>
          <Select
            w="20%"
            onChange={(e) => {
              setOrgName(e.target.value)
            }}
          >
            {createOrgOptions()}
          </Select>
        </Stack>
        {/* )} */}
        {createOrgOptions().length > 1 && orgName !== '' ? (
          <AdminPanel name={orgName} />
        ) : (
          <Stack align="center">
            <Text fontSize="2xl" fontWeight="bold">
              Empty...
            </Text>
          </Stack>
        )}
      </Stack>
    </Layout>
  )
}
