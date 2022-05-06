import React, { useCallback, useState } from 'react'
import {
  Accordion,
  AccordionButton,
  AccordionItem,
  AccordionPanel,
  Badge,
  Box,
  Flex,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Stack,
  Text,
} from '@chakra-ui/react'

import { FIND_MY_USERS } from '../graphql/queries'
import { LoadingMessage } from '../components/LoadingMessage'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { RelayPaginationControls } from '../components/RelayPaginationControls'
import { usePaginatedCollection } from '../utilities/usePaginatedCollection'
import { useDebouncedFunction } from '../utilities/useDebouncedFunction'
import { Trans, t } from '@lingui/macro'
import {
  CheckCircleIcon,
  EditIcon,
  EmailIcon,
  MinusIcon,
} from '@chakra-ui/icons'

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

  const userList =
    loading || isLoadingMore ? (
      <LoadingMessage>
        <Trans>User List</Trans>
      </LoadingMessage>
    ) : nodes.length === 0 ? (
      <Text layerStyle="loadingMessage">
        <Trans>No users</Trans>
      </Text>
    ) : (
      nodes.map(
        ({ id, userName, displayName, emailValidated, affiliations }) => {
          const { totalCount, edges: orgEdges } = affiliations
          const orgNodes = orgEdges?.map((e) => e.node)
          let userAffiliations
          if (totalCount === 0) {
            userAffiliations = (
              <Text>
                <Trans>
                  This user is not affiliated with any organizations
                </Trans>
              </Text>
            )
          } else {
            userAffiliations = (
              <Stack>
                {orgNodes.map(({ permission: role, organization }) => {
                  const {
                    id: orgId,
                    name: orgName,
                    acronym,
                    _slug,
                    verified,
                  } = organization
                  return (
                    <Flex
                      key={orgId}
                      // justify="space-around"
                      // borderColor="black"
                      // borderWidth="1px"
                      // rounded="md"
                      align="center"
                      p="1"
                      w="100%"
                    >
                      <Stack direction="row" flexGrow="0" mr="auto">
                        <IconButton
                          aria-label="Remove User"
                          variant="danger"
                          onClick={() => {
                            // setSelectedRemoveUser(node.user)
                            // removeOnOpen()
                            console.log(`Removed user from org ${orgName}`)
                          }}
                          p={2}
                          m={0}
                          icon={<MinusIcon />}
                        />
                        <IconButton
                          aria-label="Edit User"
                          variant="primary"
                          onClick={() => {
                            // setEditingUserRole(userRole)
                            // setEditingUserName(node.user.userName)
                            // setMutation('update')
                            // updateOnOpen()
                            console.log(`Edit user in org ${orgName}`)
                          }}
                          p={2}
                          m={0}
                          icon={<EditIcon />}
                        />
                      </Stack>
                      <Flex
                        justify="space-around"
                        borderColor="black"
                        borderWidth="1px"
                        rounded="md"
                        align="center"
                        p="1"
                        w="100%"
                      >
                        <Text fontWeight="bold">
                          {orgName} ({acronym}){' '}
                          {verified && (
                            <CheckCircleIcon
                              color="blue.500"
                              size="icons.sm"
                              aria-label="Verified Organization"
                            />
                          )}
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
                    </Flex>
                  )
                })}
              </Stack>
            )
          }
          return (
            <AccordionItem key={id}>
              <AccordionButton
                width="100%"
                p="4"
                // pl={{ md: '8' }}
                alignItems={{ base: 'flex-start', md: 'center' }}
                flexDirection={{ base: 'column', md: 'row' }}
                // textAlign="left"
                _hover={{ bg: 'gray.100' }}
                mb="2"
                borderWidth="1px"
                borderColor="black"
                rounded="md"
              >
                <Flex w="100%" justify="space-around" align="center">
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
              </AccordionButton>
              <AccordionPanel>{userAffiliations}</AccordionPanel>
            </AccordionItem>
          )
        },
      )
    )

  return (
    <Box>
      <Flex align="center" flexDirection={{ base: 'column', md: 'row' }} mb="2">
        <Text
          as="label"
          htmlFor="Search-for-user-field"
          fontSize="md"
          fontWeight="bold"
          textAlign="center"
          mr={2}
        >
          <Trans>Search: </Trans>
        </Text>
        <InputGroup
          width={{ base: '100%', md: '75%' }}
          mb={{ base: '8px', md: '0' }}
          mr={{ base: '0', md: '4' }}
        >
          <InputLeftElement aria-hidden="true">
            <EmailIcon color="gray.300" />
          </InputLeftElement>
          <Input
            id="Search-for-user-field"
            aria-label="new-user-input"
            placeholder={t`user email`}
            onChange={(e) => setAddedUserName(e.target.value)}
          />
        </InputGroup>
      </Flex>
      <Accordion allowMultiple defaultIndex={[]}>
        {userList}
      </Accordion>
      <RelayPaginationControls
        onlyPagination={true}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
        next={next}
        previous={previous}
        isLoadingMore={isLoadingMore}
      />
    </Box>
  )
}
