import React, { useState } from 'react'
import { Stack, Text, Select, useToast } from '@chakra-ui/core'
import { Trans, t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Layout } from './Layout'
import AdminPanel from './AdminPanel'
import { USER_AFFILIATIONS } from './graphql/queries'
import { useQuery } from '@apollo/client'
import { useUserState } from './UserState'

export default function AdminPage() {
  const { currentUser } = useUserState()
  const [orgName, setOrgName] = useState()
  const { i18n } = useLingui()
  const toast = useToast()

  const { loading, error, data } = useQuery(USER_AFFILIATIONS, {
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
    return <p>Loading user affilliations...</p>
  }

  if (error) {
    return <p>{String(error)}</p>
  }

  const adminAffiliations = {}
  if (data?.user[0]?.affiliations?.edges) {
    const {
      affiliations: { edges },
    } = data.user[0]
    for (let i = 0; i < edges.length; i++) {
      const {
        node: {
          permission,
          organization: { acronym },
        },
      } = edges[i]
      if (permission === 'ADMIN' || permission === 'SUPER_ADMIN') {
        adminAffiliations[acronym] = permission
      }
    }
  }

  const adminOrgs = Object.keys(adminAffiliations)

  const options = [
    <option hidden key="default">
      {t`Select an organization`}
    </option>,
  ]

  for (let i = 0; i < adminOrgs.length; i++) {
    options.push(
      <option key={'option' + i} value={adminOrgs[i]}>
        {adminOrgs[i]}
      </option>,
    )
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
              aria-label="Select an organization"
              w={['100%', '25%']}
              size="lg"
              variant="filled"
              onChange={(e) => {
                setOrgName(e.target.value)
              }}
            >
              {options}
            </Select>
          </Stack>
          {options.length > 1 && orgName ? (
            <Stack>
              <AdminPanel
                orgName={orgName}
                permission={adminAffiliations[orgName]}
                mr="4"
              />
              <Trans>
                *search bars do not actively search databases currently. They
                are used to demonstrate the 'add' button feature
              </Trans>
            </Stack>
          ) : (
            <Text fontSize="2xl" fontWeight="bold" textAlign="center">
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
