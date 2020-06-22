import React from 'react'
import { Stack, Text, Select, Divider } from '@chakra-ui/core'
import { Trans, t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Layout } from './Layout'
import AdminPanel from './AdminPanel'
import { array } from 'prop-types'

export default function AdminPage({ ...props }) {
  const { orgs } = props
  const [orgName, setOrgName] = React.useState('')
  const { i18n } = useLingui()

  const getOrgOptions = () => {
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
          <option value={orgs[i].node.organization.acronym}>
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
            {getOrgOptions()}
          </Select>
        </Stack>
        {getOrgOptions().length > 1 && orgName !== '' ? (
          <Stack>
            <AdminPanel orgName={orgName} />
            <Divider />
            <Trans>
              *search bars do not actively search databases currently. They are
              used to demonstrate the 'add' button feature
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
}

AdminPage.propTypes = {
  orgs: array,
}
