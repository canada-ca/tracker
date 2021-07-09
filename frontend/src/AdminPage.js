import React, { useState } from 'react'
import { Stack, Text, useToast, Icon, Divider, Box } from '@chakra-ui/core'
import { Trans, t } from '@lingui/macro'
import { Layout } from './Layout'
import AdminPanel from './AdminPanel'
import { ADMIN_AFFILIATIONS, IS_USER_SUPER_ADMIN } from './graphql/queries'
import { useQuery } from '@apollo/client'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'
import { LoadingMessage } from './LoadingMessage'
import { TrackerButton } from './TrackerButton'
import { Link as RouteLink } from 'react-router-dom'
import OrganizationInformation from './OrganizationInformation'
import { Dropdown } from './Dropdown'

export default function AdminPage() {
  const [selectedOrg, setSelectedOrg] = useState('none')
  const [orgDetails, setOrgDetails] = useState({})
  const toast = useToast()

  const { loading, error, data } = useQuery(ADMIN_AFFILIATIONS, {
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    variables: {
      first: 100,
      orderBy: { field: 'NAME', direction: 'ASC' },
      isAdmin: true,
      includeSuperAdminOrg: true,
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

  const { data: isSA } = useQuery(IS_USER_SUPER_ADMIN, {
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
    return <LoadingMessage />
  }

  if (error) {
    return <ErrorFallbackMessage error={error} />
  }

  const options = []
  data.findMyOrganizations?.edges.forEach((edge) => {
    const { slug, name, id } = edge.node
    options.push({ label: name, value: { slug: slug, id: id } })
  })

  if (options.length > 1) {
    return (
      <Layout>
        <Stack spacing={10}>
          <Text fontSize="4xl" fontWeight="bold" textAlign={['center', 'left']}>
            <Trans>Welcome, Admin</Trans>
          </Text>

          <Stack flexDirection={['column', 'row']} align="center">
            <label htmlFor="organization select">
              <Text fontWeight="bold" fontSize="2xl" mr="4" mb={['0', '2']}>
                <Trans>Organization: </Trans>
              </Text>
            </label>
            <Box w={['100%', '50%']}>
              <Dropdown
                id="organization select"
                options={options}
                placeholder={t`Select an organization`}
                onChange={(opt) => {
                  setOrgDetails(opt.value)
                  setSelectedOrg(opt.label)
                }}
              />
            </Box>
            <TrackerButton
              ml={['0', 'auto']}
              w={['100%', 'auto']}
              variant="primary"
              as={RouteLink}
              to="/create-organization"
            >
              <Icon name="add" />
              <Trans>Create Organization</Trans>
            </TrackerButton>
          </Stack>
          {options.length > 1 && selectedOrg !== 'none' ? (
            <>
              <OrganizationInformation
                orgSlug={orgDetails.slug}
                mb="1rem"
                removeOrgCallback={setSelectedOrg}
                // set key, this resets state when switching orgs (closes editing box)
                key={orgDetails.slug}
              />
              <AdminPanel
                orgSlug={orgDetails.slug}
                orgId={orgDetails.id}
                permission={isSA?.isUserSuperAdmin ? 'SUPER_ADMIN' : 'ADMIN'}
                mr="4"
              />
            </>
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
      <Layout>
        <Stack align="center">
          <Text fontSize="3xl" fontWeight="bold" textAlign="center">
            <Trans>You do not have admin permissions in any organization</Trans>
          </Text>
          <Divider />
          <TrackerButton
            w={['100%', 'auto']}
            variant="primary"
            as={RouteLink}
            to="/create-organization"
          >
            <Icon name="add" />
            <Trans>Create Organization</Trans>
          </TrackerButton>
        </Stack>
      </Layout>
    )
  }
}
