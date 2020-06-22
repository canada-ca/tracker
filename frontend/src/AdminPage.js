import React from 'react'
import { Stack, Text, Select, Divider } from '@chakra-ui/core'
import { Trans } from '@lingui/macro'
import { Layout } from './Layout'
import AdminPanel from './AdminPanel'
import { array } from 'prop-types'

export default function AdminPage({ ...props }) {
  const { orgs } = props
  const [orgName, setOrgName] = React.useState('')

  const getOrgOptions = () => {
    const options = [
      <option hidden key="default">
        Select an organization
      </option>,
    ]

    for (let i = 0; i < orgs.length; i++) {
      if (
        orgs[i].node.permission === 'ADMIN' ||
        orgs[i].node.permission === 'SUPER_ADMIN'
      ) {
        options.push(
          <option value={orgs[i].node.organization.id}>
            {orgs[i].node.organization.acronym}
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

AdminPage.propTypes = {
  orgs: array,
}
