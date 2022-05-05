import React, { useCallback, useState } from 'react'
import { Badge, Box, Flex, Stack, Text } from '@chakra-ui/react'

import { FIND_MY_USERS } from '../graphql/queries'
import { LoadingMessage } from '../components/LoadingMessage'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { RelayPaginationControls } from '../components/RelayPaginationControls'
import { usePaginatedCollection } from '../utilities/usePaginatedCollection'
import { useDebouncedFunction } from '../utilities/useDebouncedFunction'
import { Trans } from '@lingui/macro'

export function NewUserList() {
  const [addedUserName, setAddedUserName] = useState('')

  const [debouncedSearchUser, setDebouncedSearchUser] = useState('')

  const memoizedSetDebouncedSearchTermCallback = useCallback(() => {
    setDebouncedSearchUser(addedUserName)
  }, [addedUserName])

  useDebouncedFunction(memoizedSetDebouncedSearchTermCallback, 500)

  const {
    loading,
    isLoadingMore,
    error,
    nodes,
    next,
    previous,
    hasNextPage,
    hasPreviousPage,
  } = usePaginatedCollection({
    fetchForward: FIND_MY_USERS,
    recordsPerPage: 10,
    variables: { search: debouncedSearchUser },
    relayRoot: 'findMyUsers',
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  })

  if (error) return <ErrorFallbackMessage error={error} />

  const userList = loading ? (
    <LoadingMessage>
      <Trans>User List</Trans>
    </LoadingMessage>
  ) : nodes.length === 0 ? (
    <Text layerStyle="loadingMessage">
      <Trans>No users</Trans>
    </Text>
  ) : (
    nodes.map(({ id, userName, displayName, emailValidated, affiliations }) => {
      const { totalCount, edges: orgEdges } = affiliations
      const orgNodes = orgEdges?.map((e) => e.node)
      let userAffiliations
      if (totalCount === 0) {
        userAffiliations = (
          <Text>
            <Trans>This user is not affiliated with any organizations</Trans>
          </Text>
        )
      } else {
        userAffiliations = (
          <Stack>
            {orgNodes.map(({ permission: role, organization }) => {
              const { id: orgId, name, acronym, slug } = organization
              return (
                <Flex key={orgId} justify="space-around">
                  <Text fontWeight="bold">
                    {name} ({acronym})
                  </Text>
                  <Badge
                    variant="solid"
                    bg={
                      role === 'USER'
                        ? 'primary'
                        : role === 'ADMIN'
                        ? 'info'
                        : 'weak'
                    }
                    pt={1}
                    mr={{ md: '1rem' }}
                    justifySelf={{ base: 'start', md: 'end' }}
                  >
                    {role}
                  </Badge>
                </Flex>
              )
            })}
          </Stack>
        )
      }
      return (
        <Box key={id}>
          <Flex justify="space-around" as="button">
            <Text>{userName}</Text>
            <Text>{displayName}</Text>
            <Badge
              variant="solid"
              bg={emailValidated ? 'strong' : 'weak'}
              pt={1}
              mr={{ md: '1rem' }}
              justifySelf={{ base: 'start', md: 'end' }}
            >
              <Trans>Verified</Trans>
            </Badge>
            <Text>
              <Trans>Affiliations:</Trans> {totalCount}
            </Text>
          </Flex>
          {userAffiliations}
        </Box>
      )
    })
  )

  return userList
}
