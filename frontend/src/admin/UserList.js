import React, { useCallback, useState } from 'react'
import {
  Box,
  Button,
  Divider,
  Flex,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Text,
  useDisclosure,
} from '@chakra-ui/react'
import { AddIcon, EditIcon, EmailIcon, MinusIcon } from '@chakra-ui/icons'
import { t, Trans } from '@lingui/macro'
import { string } from 'prop-types'

import { UserListModal } from './UserListModal'

import { PAGINATED_ORG_AFFILIATIONS_ADMIN_PAGE as FORWARD } from '../graphql/queries'
import { UserCard } from '../components/UserCard'
import { LoadingMessage } from '../components/LoadingMessage'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { RelayPaginationControls } from '../components/RelayPaginationControls'
import { usePaginatedCollection } from '../utilities/usePaginatedCollection'
import { useDebouncedFunction } from '../utilities/useDebouncedFunction'
import { bool } from 'prop-types'

export function UserList({ includePending, permission, orgSlug, orgId }) {
  const [mutation, setMutation] = useState()
  const [addedUserName, setAddedUserName] = useState('')
  const [selectedRemoveUser, setSelectedRemoveUser] = useState({
    id: null,
    userName: null,
  })
  const [usersPerPage, setUsersPerPage] = useState(50)
  const [editingUserRole, setEditingUserRole] = useState()
  const [editingUserName, setEditingUserName] = useState()
  const { isOpen, onOpen, onClose } = useDisclosure()

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
    resetToFirstPage,
    totalCount,
  } = usePaginatedCollection({
    fetchForward: FORWARD,
    recordsPerPage: usersPerPage,
    variables: {
      orgSlug,
      search: debouncedSearchUser,
      includePending,
      orderBy: { field: 'PERMISSION', direction: 'ASC' },
    },
    relayRoot: 'findOrganizationBySlug.affiliations',
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
    nodes.map(({ id, permission: userRole, user }) => {
      return (
        <UserCard
          key={`${user.userName}:${id}`}
          flexGrow="1"
          userName={user.userName}
          displayName={user.displayName}
          role={userRole}
          ml={{ base: 4, md: 0 }}
        >
          <IconButton
            aria-label="Remove User"
            variant="danger"
            onClick={() => {
              setSelectedRemoveUser(user)
              setMutation('remove')
              onOpen()
            }}
            px="2"
            mr="1"
            icon={<MinusIcon />}
          />
          <IconButton
            aria-label="Edit User"
            variant="primary"
            onClick={() => {
              setEditingUserRole(userRole)
              setEditingUserName(user.userName)
              setMutation('update')
              onOpen()
            }}
            px="2"
            mr="2"
            icon={<EditIcon />}
          />
        </UserCard>
      )
    })
  )

  return (
    <Flex mb="6" w="100%" flexDirection="column">
      <Box bg="gray.100" p="2" mb="2" borderColor="gray.300" borderWidth="1px">
        <form
          id="form"
          onSubmit={(e) => {
            e.preventDefault() // prevents page from refreshing
            setMutation('create')
            setEditingUserRole('USER')
            setEditingUserName(addedUserName)
            onOpen()
          }}
        >
          <Flex flexDirection={{ base: 'column', md: 'row' }} align="center">
            <Text
              as="label"
              htmlFor="Search-for-domain-field"
              fontSize="md"
              fontWeight="bold"
              textAlign="center"
              mr={2}
            >
              <Trans>Search: </Trans>
            </Text>
            <InputGroup width={{ base: '100%', md: '75%' }} mb={{ base: '8px', md: '0' }} mr={{ base: '0', md: '4' }}>
              <InputLeftElement aria-hidden="true">
                <EmailIcon color="gray.300" />
              </InputLeftElement>
              <Input
                borderColor="black"
                id="Search-for-user-field"
                aria-label="new-user-input"
                placeholder={t`User email`}
                onChange={(e) => setAddedUserName(e.target.value)}
              />
            </InputGroup>
            <Button w={{ base: '100%', md: '25%' }} variant="primary" type="submit">
              <AddIcon mr={2} aria-hidden="true" />
              <Trans>Invite User</Trans>
            </Button>
          </Flex>
        </form>
        <Divider borderBottomWidth="1px" borderBottomColor="black" />
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
          totalRecords={totalCount}
        />
      </Box>

      {userList}

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
        totalRecords={totalCount}
      />

      <UserListModal
        isOpen={isOpen}
        onClose={onClose}
        orgId={orgId}
        editingUserName={mutation === 'remove' ? selectedRemoveUser.userName : editingUserName}
        editingUserRole={editingUserRole}
        editingUserId={selectedRemoveUser.id}
        orgSlug={orgSlug}
        permission={permission}
        mutation={mutation}
      />
    </Flex>
  )
}

UserList.propTypes = {
  orgSlug: string,
  permission: string,
  orgId: string.isRequired,
  includePending: bool,
}
