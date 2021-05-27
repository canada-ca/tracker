import React, { useState } from 'react'
import { Stack, Text, Select, useToast } from '@chakra-ui/core'
import { Trans, t } from '@lingui/macro'
import { Layout } from './Layout'
import AdminPanel from './AdminPanel'
import { USER_AFFILIATIONS } from './graphql/queries'
import { useQuery } from '@apollo/client'
import { useUserState } from './UserState'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'
import { LoadingMessage } from './LoadingMessage'

export default function AdminPage() {
  const { currentUser } = useUserState()
  const [orgDetails, setOrgDetails] = useState()
  const toast = useToast()

  const { loading, error, data } = useQuery(USER_AFFILIATIONS, {
    context: {
      headers: {
        authorization: currentUser.jwt,
      },
    },
    variables: {
      first: 100,
      orderBy: {
        field: 'ORG_ACRONYM',
        direction: 'ASC',
      },
    },
    onError: (error) => {
      const [_, message] = error.message.split(': ')
      toast({
        title: 'Error',
        description: message,
        status: 'error',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    },
  })

  if (loading) {
    return (
      <LoadingMessage>
        <Trans>Admin Affiliations</Trans>
      </LoadingMessage>
    )
  }

  if (error) {
    return <ErrorFallbackMessage error={error} />
  }

  const adminAffiliations = {}
  data.findMe.affiliations?.edges.forEach((edge) => {
    const {
      permission,
      organization: { slug, acronym, id },
    } = edge.node
    if (permission === 'ADMIN' || permission === 'SUPER_ADMIN') {
      adminAffiliations[acronym] = {
        slug: slug,
        permission: permission,
        id: id,
      }
    }
  })

  const adminOrgsAcronyms = Object.keys(adminAffiliations)

  const options = [
    <option hidden key="default">
      {t`Select an organization`}
    </option>,
  ]

  adminOrgsAcronyms.forEach((acronym) => {
    options.push(
      <option key={acronym} value={acronym}>
        {acronym}
      </option>,
    )
  })

  if (options.length > 1) {
    return (
      <Layout>
        <Stack spacing={10}>
          <Text fontSize="4xl" fontWeight="bold" textAlign={['center', 'left']}>
            <Trans>Welcome, Admin</Trans>
          </Text>
          <Stack isInline align="center">
            <Text fontWeight="bold" fontSize="2xl">
              <Trans>Organization: </Trans>
            </Text>
            <Select
              aria-label="Select an organization"
              w={['100%', '25%']}
              size="lg"
              variant="filled"
              onChange={(e) => {
                setOrgDetails(adminAffiliations[e.target.value])
              }}
            >
              {options}
            </Select>
          </Stack>
          {options.length > 1 && orgDetails ? (
            <Stack>
              <AdminPanel
                orgSlug={orgDetails.slug}
                orgId={orgDetails.id}
                permission={orgDetails.permission}
                mr="4"
              />
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
      <Text fontSize="3xl" fontWeight="bold" textAlign="center">
        <Trans>You do not have admin permissions in any organization</Trans>
      </Text>
    )
  }
}
