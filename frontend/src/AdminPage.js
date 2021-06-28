import React, { useState, useCallback } from 'react'
import {
  Stack,
  Text,
  Select,
  useToast,
  Icon,
  // Divider,
  InputGroup,
  InputLeftElement,
  Input,
} from '@chakra-ui/core'
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
import { useDebouncedFunction } from './useDebouncedFunction'

export default function AdminPage() {
  const [selectedOrg, setSelectedOrg] = useState('none')
  const [orgDetails, setOrgDetails] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const toast = useToast()

  const memoizedSetDebouncedSearchTermCallback = useCallback(() => {
    setDebouncedSearchTerm(searchTerm)
  }, [searchTerm])

  useDebouncedFunction(memoizedSetDebouncedSearchTermCallback, 500)

  const { loading, error, data } = useQuery(ADMIN_AFFILIATIONS, {
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    variables: {
      first: 100,
      orderBy: { field: 'ACRONYM', direction: 'ASC' },
      isAdmin: true,
      includeSuperAdminOrg: true,
      search: debouncedSearchTerm,
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

  if (error) {
    return <ErrorFallbackMessage error={error} />
  }

  const options = [
    <option hidden key="default" value="none">
      {t`Select an organization`}
    </option>,
  ]
  let optionsSelect

  if (loading) {
    optionsSelect = (
      <LoadingMessage>
        <Trans>Admin Affiliations</Trans>
      </LoadingMessage>
    )
  } else {
    const adminAffiliations = {}
    data.findMyOrganizations?.edges.forEach((edge) => {
      const { slug, acronym, id } = edge.node
      adminAffiliations[acronym] = {
        slug: slug,
        id: id,
      }
    })

    const adminOrgsAcronyms = Object.keys(adminAffiliations)

    adminOrgsAcronyms.forEach((acronym) => {
      options.push(
        <option key={acronym} value={acronym}>
          {acronym}
        </option>,
      )
    })

    optionsSelect = (
      <Select
        w={['100%', '25%']}
        size="lg"
        variant="filled"
        onChange={(e) => {
          setOrgDetails(adminAffiliations[e.target.value])
          setSelectedOrg(e.target.value)
        }}
        value={selectedOrg}
      >
        {options}
      </Select>
    )
  }

  // if (options.length > 1) {
  return (
    <Layout>
      <Stack spacing={10}>
        <Text fontSize="4xl" fontWeight="bold" textAlign={['center', 'left']}>
          <Trans>Welcome, Admin</Trans>
        </Text>
        <InputGroup mb={{ base: '8px', md: '0' }} flexGrow={1}>
          <InputLeftElement>
            <Icon name="search" color="gray.300" />
          </InputLeftElement>
          <Input
            type="text"
            placeholder={t`Search for an organization`}
            onChange={(e) => {
              setSearchTerm(e.target.value)
            }}
          />
        </InputGroup>
        <Stack flexDirection={['column', 'row']} align="center">
          <Text fontWeight="bold" fontSize="2xl">
            <Trans>Organization: </Trans>
          </Text>
          {optionsSelect}
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
} /* else {
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
  } */
// }
