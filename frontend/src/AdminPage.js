import React, { useState } from 'react'
import { Button, Divider, Flex, Stack, Text, useToast } from '@chakra-ui/react'
import { AddIcon } from '@chakra-ui/icons'
import { t, Trans } from '@lingui/macro'
import AdminPanel from './AdminPanel'
import { ADMIN_AFFILIATIONS, IS_USER_SUPER_ADMIN } from './graphql/queries'
import { useQuery } from '@apollo/client'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'
import { LoadingMessage } from './LoadingMessage'
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
      <Stack spacing={10} w="100%" px={4}>
        <Text fontSize="4xl" fontWeight="bold" textAlign={['center', 'left']}>
          <Trans>Welcome, Admin</Trans>
        </Text>
        <Flex
          direction={{ base: 'column', md: 'row' }}
          align="center"
          justifyContent="space-between"
        >
          <Dropdown
            label={t`Organization: `}
            labelDirection="row"
            options={options}
            placeholder={t`Select an organization`}
            onChange={(opt) => {
              setOrgDetails(opt.value)
              setSelectedOrg(opt.label)
            }}
          />
          <Button
            variant="primary"
            ml={{ base: '0', md: 'auto' }}
            w={{ base: '100%', md: 'auto' }}
            mt={{ base: 2, md: 0 }}
            as={RouteLink}
            to="/create-organization"
          >
            <AddIcon mr={2} />
            <Trans>Create Organization</Trans>
          </Button>
        </Flex>
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
    )
  } else {
    return (
      <Stack align="center" w="100%" px={4}>
        <Text fontSize="3xl" fontWeight="bold" textAlign="center">
          <Trans>You do not have admin permissions in any organization</Trans>
        </Text>
        <Divider />
        <Button
          variant="primary"
          w={{ base: '100%', md: 'auto' }}
          as={RouteLink}
          to="/create-organization"
        >
          <AddIcon />
          <Trans>Create Organization</Trans>
        </Button>
      </Stack>
    )
  }
}
