import React from 'react'
import { Stack, Text, Select, Divider } from '@chakra-ui/core'
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

  const getOrgOptions = () => {
    const options = [
      <option hidden key="default">
        Select an organization
      </option>,
    ]

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

    // affiliations.map((org) => {
    //   return (
    //     org.admin && <option key={org.organization}>{org.organization}</option>
    //   )
    // })
  }

  return (
    <Layout>
      <Stack spacing={10}>
        <Text fontSize="3xl" fontWeight="bold">
          Welcome, Admin
        </Text>
        <Stack isInline align="center">
          <Text fontWeight="bold" fontSize="xl">
            Organization:{' '}
          </Text>
          <Select
            w="25%"
            size="lg"
            variant="filled"
            onChange={(e) => {
              setOrgName(e.target.value)
            }}
          >
            {getOrgOptions()}
          </Select>
        </Stack>
        {getOrgOptions().length > 1 && orgName !== '' ? (
          <Stack>
            <AdminPanel orgName={orgName} />
            <Divider />
            <Text>
              *search bars do not actively search databases currently. They are
              used to demonstrate the 'add' button feature
            </Text>
          </Stack>
        ) : (
          <Text fontSize="2xl" fontWeight="bold" textAlign={['center']}>
            Select an organization to view admin options
          </Text>
        )}
      </Stack>
    </Layout>
  )
}
