import React from 'react'
import { Stack, Text, Select, Divider } from '@chakra-ui/core'
import { Trans, t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Layout } from './Layout'
import AdminPanel from './AdminPanel'
import { array } from 'prop-types'
import { USER_AFFILIATIONS } from './graphql/queries'
import { useQuery } from '@apollo/react-hooks'
import { useUserState } from './UserState'

export default function AdminPage() {
  const { currentUser } = useUserState()
  const [orgName, setOrgName] = React.useState('')
  const { i18n } = useLingui()

  const { loading, error, data } = useQuery(USER_AFFILIATIONS, {
    context: {
      headers: {
        authorization: currentUser.jwt,
      },
    },
    onError: (error) => {
      const [_, message] = error.message.split(': ')
      console.log(message)
    },
  })

  if (loading) {
    return <p>Loading user affilliations...</p>
  }

  if (error) {
    return <p>{String(error)}</p>
  }

  let orgs = []
  if (data && data.user && data.user[0].affiliations.edges) {
    orgs = data.user[0].affiliations.edges
  }

  const options = [
    <option hidden key="default">
      {i18n._(t`Select an organization`)}
    </option>,
  ]

  for (let i = 0; i < orgs.length; i++) {
    if (
      orgs[i].node.permission === 'ADMIN' ||
      orgs[i].node.permission === 'SUPER_ADMIN'
    ) {
      options.push(
        <option key={'option' + i} value={orgs[i].node.organization.acronym}>
          {orgs[i].node.organization.acronym}
        </option>,
      )
    }
  }

  if (options.length > 1) {
    return (
      <Layout>
        <Stack spacing={10}>
          <Text fontSize="3xl" fontWeight="bold">
            <Trans>Welcome, Admin</Trans>
          </Text>
          <Stack isInline align="center">
            <Text fontWeight="bold" fontSize="xl">
              <Trans>Organization: </Trans>
            </Text>
            <Select
              w="25%"
              size="lg"
              variant="filled"
              onChange={(e) => {
                setOrgName(e.target.value)
              }}
            >
              {options}
            </Select>
          </Stack>
          {options.length > 1 && orgName !== '' ? (
            <Stack>
              <AdminPanel orgName={orgName} />
              <Divider />
              <Trans>
                *search bars do not actively search databases currently. They
                are used to demonstrate the 'add' button feature
              </Trans>
            </Stack>
          ) : (
            <Text fontSize="2xl" fontWeight="bold" textAlign={['center']}>
              <Trans>Select an organization to view admin options</Trans>
            </Text>
          )}
        </Stack>
      </Layout>
    )
  } else {
    return (
      <Text fontSize="3xl" fontWeight="bold">
        <Trans>You do not have admin permissions in any organization</Trans>
      </Text>
    )
  }
}

AdminPage.propTypes = {
  orgs: array,
}
