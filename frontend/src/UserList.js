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
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  useDisclosure,
  useToast,
} from '@chakra-ui/react'
import { AddIcon, EditIcon, EmailIcon, MinusIcon } from '@chakra-ui/icons'
import { t, Trans } from '@lingui/macro'
import { UserCard } from './UserCard'
import { number, string } from 'prop-types'
import { useMutation } from '@apollo/client'
import { REMOVE_USER_FROM_ORG } from './graphql/mutations'
import { LoadingMessage } from './LoadingMessage'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'
import { usePaginatedCollection } from './usePaginatedCollection'
import { PAGINATED_ORG_AFFILIATIONS_ADMIN_PAGE as FORWARD } from './graphql/queries'
import { RelayPaginationControls } from './RelayPaginationControls'
import { useDebouncedFunction } from './useDebouncedFunction'
import { UserListModal } from './UserListModal'

export default function UserList({ permission, orgSlug, usersPerPage, orgId }) {
  const toast = useToast()
  const [mutation, setMutation] = useState()
  const [addedUserName, setAddedUserName] = useState()
  const [selectedRemoveUser, setSelectedRemoveUser] = useState({
    id: null,
    userName: null,
  })

  const {
    isOpen: removeIsOpen,
    onOpen: removeOnOpen,
    onClose: removeOnClose,
  } = useDisclosure()

  const [editingUserRole, setEditingUserRole] = useState()
  const [editingUserName, setEditingUserName] = useState()
  const {
    isOpen: updateIsOpen,
    onOpen: updateOnOpen,
    onClose: updateOnClose,
  } = useDisclosure()

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
    fetchForward: FORWARD,
    recordsPerPage: usersPerPage,
    variables: { orgSlug, search: debouncedSearchUser },
    relayRoot: 'findOrganizationBySlug.affiliations',
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  })

  const [removeUser, { loading: removeUserLoading }] = useMutation(
    REMOVE_USER_FROM_ORG,
    {
      refetchQueries: ['PaginatedOrgAffiliations'],
      awaitRefetchQueries: true,

      onError(error) {
        toast({
          title: t`An error occurred.`,
          description: error.message,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      },
      onCompleted({ removeUserFromOrg }) {
        if (removeUserFromOrg.result.__typename === 'RemoveUserFromOrgResult') {
          removeOnClose()
          toast({
            title: t`User removed.`,
            description: t`Successfully removed user ${removeUserFromOrg.result.user.userName}.`,
            status: 'success',
            duration: 9000,
            isClosable: true,
            position: 'top-left',
          })
        } else if (removeUserFromOrg.result.__typename === 'AffiliationError') {
          toast({
            title: t`Unable to remove user.`,
            description: removeUserFromOrg.result.description,
            status: 'error',
            duration: 9000,
            isClosable: true,
            position: 'top-left',
          })
        }
      },
    },
  )

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
    nodes.map((node) => {
      const userRole = node.permission
      return (
        <Box key={`${node.user.userName}:${node.id}`}>
          <Flex align="center" w="100%">
            <Stack direction="row" flexGrow="0">
              <IconButton
                aria-label="Remove User"
                variant="danger"
                onClick={() => {
                  setSelectedRemoveUser(node.user)
                  removeOnOpen()
                }}
                p={2}
                m={0}
                icon={<MinusIcon />}
              />
              <IconButton
                aria-label="Edit User"
                variant="primary"
                onClick={() => {
                  setEditingUserRole(userRole)
                  setEditingUserName(node.user.userName)
                  setMutation('update')
                  updateOnOpen()
                }}
                p={2}
                m={0}
                icon={<EditIcon />}
              />
            </Stack>
            <UserCard
              flexGrow="1"
              userName={node.user.userName}
              displayName={node.user.displayName}
              role={userRole}
              ml={{ base: 4, md: 0 }}
            />
          </Flex>
          <Divider borderColor="gray.900" />
        </Box>
      )
    })
  )

  return (
    <Flex mb="6" w="100%" flexDirection="column">
      <form
        onSubmit={(e) => {
          // Manually handle submit
          // if error exist, show toast. Only submit if no errors
          e.preventDefault()
          setMutation('create')
          setEditingUserRole('USER')
          setEditingUserName(addedUserName)
          updateOnOpen()
        }}
      >
        <Stack
          align="center"
          w="100%"
          flexDirection={{ base: 'column', md: 'row' }}
          isInline
          mb="2"
        >
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
          <InputGroup flexGrow={1} w="50%">
            <InputLeftElement aria-hidden="true">
              <EmailIcon color="gray.300" />
            </InputLeftElement>
            <Input
              id="Search-for-user-field"
              aria-label="new-user-input"
              type="email"
              placeholder={t`user email`}
              onChange={(e) => setAddedUserName(e.target.value)}
            />
          </InputGroup>

          <Button
            w={{ base: '100%', md: '25%' }}
            variant="primary"
            type="submit"
            // isLoading={userForm.isSubmitting}
          >
            <AddIcon mr={2} aria-hidden="true" />
            <Trans>Invite User</Trans>
          </Button>
        </Stack>
      </form>

      {userList}

      <RelayPaginationControls
        onlyPagination={true}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
        next={next}
        previous={previous}
        isLoadingMore={isLoadingMore}
      />

      <Modal
        isOpen={removeIsOpen}
        onClose={removeOnClose}
        motionPreset="slideInBottom"
      >
        <ModalOverlay />
        <ModalContent pb={4}>
          <ModalHeader>
            <Trans>Remove User</Trans>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4} p={25}>
              <Text>
                <Trans>Confirm removal of user:</Trans>
              </Text>
              <Text fontWeight="bold">{selectedRemoveUser.userName}</Text>
            </Stack>
          </ModalBody>

          <ModalFooter>
            <Button
              variant="primary"
              isLoading={removeUserLoading}
              mr={4}
              onClick={() =>
                removeUser({
                  variables: {
                    userId: selectedRemoveUser.id,
                    orgId: orgId,
                  },
                })
              }
            >
              <Trans>Confirm</Trans>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <UserListModal
        isOpen={updateIsOpen}
        onClose={updateOnClose}
        // validationSchema={validationSchema}
        orgId={orgId}
        editingUserName={editingUserName}
        editingUserRole={editingUserRole}
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
  usersPerPage: number,
  orgId: string.isRequired,
}
