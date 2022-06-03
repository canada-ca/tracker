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
  Stack,
  Text,
  useDisclosure,
} from '@chakra-ui/react'

import { FIND_MY_USERS } from '../graphql/queries'
import { LoadingMessage } from '../components/LoadingMessage'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { RelayPaginationControls } from '../components/RelayPaginationControls'
import { usePaginatedCollection } from '../utilities/usePaginatedCollection'
import { useDebouncedFunction } from '../utilities/useDebouncedFunction'
import { Trans, t } from '@lingui/macro'
import { CheckCircleIcon, EditIcon, MinusIcon } from '@chakra-ui/icons'
import { SearchBox } from '../components/SearchBox'
import { UserListModal } from './UserListModal'
import { string } from 'prop-types'

export function SuperAdminUserList({ permission }) {
  const [mutation, setMutation] = useState()
  const [orderDirection, setOrderDirection] = useState('ASC')
  const [orderField, setOrderField] = useState('USER_USERNAME')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [usersPerPage, setUsersPerPage] = useState(10)

  const { isOpen, onOpen, onClose } = useDisclosure()

  const memoizedSetDebouncedSearchTermCallback = useCallback(() => {
    setDebouncedSearchTerm(searchTerm)
  }, [searchTerm])

  useDebouncedFunction(memoizedSetDebouncedSearchTermCallback, 500)

  const {
    loading,
    isLoadingMore,
    error,
    nodes,
    next,
    previous,
    resetToFirstPage,
    hasNextPage,
    hasPreviousPage,
  } = usePaginatedCollection({
    fetchForward: FIND_MY_USERS,
    recordsPerPage: usersPerPage,
    relayRoot: 'findMyUsers',
    variables: {
      orderBy: { field: orderField, direction: orderDirection },
      search: debouncedSearchTerm,
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    errorPolicy: 'ignore', // allow partial success
  })

  if (error) return <ErrorFallbackMessage error={error} />

  const orderByOptions = [
    { value: 'USER_USERNAME', text: t`Email` },
    { value: 'USER_DISPLAYNAME', text: t`Display Name` },
    { value: 'USER_EMAIL_VALIDATED', text: t`Verified` },
  ]

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
        ({
          id: userId,
          userName,
          displayName,
          emailValidated,
          affiliations,
        }) => {
          const { totalCount, edges: orgEdges } = affiliations
          const orgNodes = orgEdges?.map((e) => e.node)
          let userAffiliations
          if (totalCount === 0) {
            userAffiliations = (
              <Box
                justify="space-between"
                borderColor="black"
                borderWidth="1px"
                rounded="md"
                align="center"
                p="2"
                w="100%"
              >
                <Text>
                  <Trans>
                    This user is not affiliated with any organizations
                  </Trans>
                </Text>
              </Box>
            )
          } else {
            userAffiliations = orgNodes.map(
              ({ permission: userRole, organization }) => {
                if (!organization) {
                  return (
                    <Box
                      justify="space-between"
                      borderColor="black"
                      borderWidth="1px"
                      rounded="md"
                      align="center"
                      p="2"
                      w="100%"
                    >
                      <Text>
                        <Trans>
                          An error occured when fetching this organization's
                          information
                        </Trans>
                      </Text>
                    </Box>
                  )
                }
                const {
                  id: orgId,
                  name: orgName,
                  acronym,
                  slug,
                  verified,
                } = organization
                return (
                  <Flex key={orgId} align="center" p="1" w="100%">
                    <Stack direction="row" flexGrow="0" mr="2">
                      <IconButton
                        aria-label={`Remove ${userName} from ${orgName}`}
                        variant="danger"
                        onClick={() => {
                          setMutation('remove')
                          onOpen()
                        }}
                        p={2}
                        m={0}
                        icon={<MinusIcon />}
                      />
                      <IconButton
                        aria-label={`Edit ${userName} in ${orgName}`}
                        variant="primary"
                        onClick={() => {
                          setMutation('update')
                          onOpen()
                        }}
                        p={2}
                        m={0}
                        icon={<EditIcon />}
                      />
                    </Stack>
                    <Flex
                      justify="space-between"
                      borderColor="black"
                      borderWidth="1px"
                      rounded="md"
                      align="center"
                      p="2"
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
                          userRole === 'USER'
                            ? 'primary'
                            : userRole === 'ADMIN'
                            ? 'info'
                            : 'weak'
                        }
                        pt={1}
                        mr={{ md: '1rem' }}
                        justifySelf={{ base: 'start', md: 'end' }}
                      >
                        {userRole}
                      </Badge>
                    </Flex>
                    <UserListModal
                      isOpen={isOpen}
                      onClose={onClose}
                      orgId={orgId}
                      editingUserName={userName}
                      editingUserRole={userRole}
                      editingUserId={userId}
                      orgSlug={slug}
                      orgName={orgName}
                      permission={permission}
                      mutation={mutation}
                    />
                  </Flex>
                )
              },
            )
          }

          return (
            <AccordionItem key={userId}>
              <AccordionButton
                width="100%"
                p="4"
                alignItems={{ base: 'flex-start', md: 'center' }}
                flexDirection={{ base: 'column', md: 'row' }}
                _hover={{ bg: 'gray.100' }}
                mb="2"
                borderWidth="1px"
                borderColor="black"
                rounded="md"
              >
                <Flex w="100%" textAlign="left">
                  <Text minW="33%">{userName}</Text>
                  <Text minW="25%">{displayName}</Text>
                  <Box minW="25%">
                    <Badge
                      variant="solid"
                      bg={emailValidated ? 'strong' : 'weak'}
                      pt={1}
                      mr={{ md: '1rem' }}
                      justifySelf={{ base: 'start', md: 'end' }}
                    >
                      <Trans>Verified</Trans>
                    </Badge>
                  </Box>
                  <Text minW="17%">
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
      <SearchBox
        selectedDisplayLimit={usersPerPage}
        setSelectedDisplayLimit={setUsersPerPage}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
        next={next}
        previous={previous}
        isLoadingMore={isLoadingMore}
        orderDirection={orderDirection}
        setSearchTerm={setSearchTerm}
        setOrderField={setOrderField}
        setOrderDirection={setOrderDirection}
        resetToFirstPage={resetToFirstPage}
        orderByOptions={orderByOptions}
        placeholder={t`Search for a user (email)`}
      />
      <Accordion defaultIndex={[]}>{userList}</Accordion>
      <RelayPaginationControls
        onlyPagination={false}
        selectedDisplayLimit={usersPerPage}
        setSelectedDisplayLimit={setUsersPerPage}
        displayLimitOptions={[5, 10, 20, 50, 100]}
        resetToFirstPage={resetToFirstPage}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
        next={next}
        previous={previous}
        isLoadingMore={isLoadingMore}
      />
    </Box>
  )
}

SuperAdminUserList.propTypes = {
  permission: string,
}
