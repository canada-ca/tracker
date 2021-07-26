import React, { useCallback, useRef, useState } from 'react'
import {
  Box,
  Button,
  Divider,
  FormLabel,
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
  Select,
  Stack,
  Text,
  useDisclosure,
  useToast,
} from '@chakra-ui/react'
import { AddIcon, EditIcon, EmailIcon, MinusIcon } from '@chakra-ui/icons'
import { t, Trans } from '@lingui/macro'
import { i18n } from '@lingui/core'
import { UserCard } from './UserCard'
import { number, string } from 'prop-types'
import { useMutation } from '@apollo/client'
import {
  INVITE_USER_TO_ORG,
  REMOVE_USER_FROM_ORG,
  UPDATE_USER_ROLE,
} from './graphql/mutations'
import { Formik, useFormik } from 'formik'
import { fieldRequirements } from './fieldRequirements'
import { object, string as yupString } from 'yup'
import { LoadingMessage } from './LoadingMessage'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'
import { usePaginatedCollection } from './usePaginatedCollection'
import { PAGINATED_ORG_AFFILIATIONS_ADMIN_PAGE as FORWARD } from './graphql/queries'
import { RelayPaginationControls } from './RelayPaginationControls'
import { useDebouncedFunction } from './useDebouncedFunction'

export default function UserList({ permission, orgSlug, usersPerPage, orgId }) {
  const toast = useToast()
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
  const initialFocusRef = useRef()

  const [debouncedSearchUser, setDebouncedSearchUser] = useState('')

  const isSuperAdminInSuperAdminOrg =
    permission === 'SUPER_ADMIN' && orgSlug === 'super-admin'

  const userForm = useFormik({
    initialValues: {
      userName: '',
      roleSelect: isSuperAdminInSuperAdminOrg ? 'SUPER_ADMIN' : 'USER',
    },
    validationSchema: object().shape({
      userName: yupString()
        .required(i18n._(fieldRequirements.email.required.message))
        .email(i18n._(fieldRequirements.email.email.message)),
    }),
    onSubmit: async (values) => {
      userForm.setFieldValue('userName', '')
      setDebouncedSearchUser('')
      setAddedUserName(values.userName)
      await addUser({
        variables: {
          userName: values.userName,
          requestedRole: values.roleSelect,
          orgId: orgId,
          preferredLang: 'ENGLISH',
        },
      })
    },
  })

  const memoizedSetDebouncedSearchTermCallback = useCallback(() => {
    setDebouncedSearchUser(userForm.values.userName)
  }, [userForm.values.userName])

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

  const [
    updateUserRole,
    { loading: _updateLoading, error: _updateError },
  ] = useMutation(UPDATE_USER_ROLE, {
    onError(updateError) {
      toast({
        title: updateError.message,
        description: t`Unable to change user role, please try again.`,
        status: 'error',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    },
    onCompleted({ updateUserRole }) {
      if (updateUserRole.result.__typename === 'UpdateUserRoleResult') {
        toast({
          title: t`Role updated`,
          description: t`The user's role has been successfully updated`,
          status: 'success',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
        updateOnClose()
      } else if (updateUserRole.result.__typename === 'AffiliationError') {
        toast({
          title: t`Unable to update user role.`,
          description: updateUserRole.result.description,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      } else {
        toast({
          title: t`Incorrect send method received.`,
          description: t`Incorrect updateUserRole.result typename.`,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
        console.log('Incorrect updateUserRole.result typename.')
      }
    },
  })

  const [addUser, { loading: addUserLoading }] = useMutation(
    INVITE_USER_TO_ORG,
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
      onCompleted({ inviteUserToOrg }) {
        if (inviteUserToOrg.result.__typename === 'InviteUserToOrgResult') {
          toast({
            title: t`User invited`,
            description: t`Email invitation sent to ${addedUserName}`,
            status: 'success',
            duration: 9000,
            isClosable: true,
            position: 'top-left',
          })
        } else if (inviteUserToOrg.result.__typename === 'AffiliationError') {
          toast({
            title: t`Unable to invite user.`,
            description: inviteUserToOrg.result.description,
            status: 'error',
            duration: 9000,
            isClosable: true,
            position: 'top-left',
          })
        } else {
          toast({
            title: t`Incorrect send method received.`,
            description: t`Incorrect inviteUserToOrg.result typename.`,
            status: 'error',
            duration: 9000,
            isClosable: true,
            position: 'top-left',
          })
          console.log('Incorrect inviteUserToOrg.result typename.')
        }
      },
    },
  )

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
          if (userForm.errors.userName) {
            toast({
              title: t`An error occurred.`,
              description: userForm.errors.userName,
              status: 'error',
              duration: 9000,
              isClosable: true,
              position: 'top-left',
            })
          } else userForm.handleSubmit()
        }}
      >
        <Stack
          align="center"
          w="100%"
          flexDirection={{ base: 'column', md: 'row' }}
          isInline
          mb="2"
        >
          <Stack
            isInline
            w="100%"
            align="center"
            mb={{ base: '2', md: '0' }}
            mr={{ base: '0', md: '2' }}
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
                isDisabled={addUserLoading}
                {...userForm.getFieldProps('userName')}
              />
            </InputGroup>

            <Select
              w="25%"
              flexBasis="7rem"
              flexShrink={0}
              {...userForm.getFieldProps('roleSelect')}
            >
              {isSuperAdminInSuperAdminOrg ? (
                <option value="SUPER_ADMIN">{t`SUPER_ADMIN`}</option>
              ) : (
                <>
                  <option value="USER">{t`USER`}</option>
                  <option value="ADMIN">{t`ADMIN`}</option>
                </>
              )}
            </Select>
          </Stack>

          <Button
            w={{ base: '100%', md: '25%' }}
            variant="primary"
            type="submit"
            isLoading={userForm.isSubmitting}
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

      <Modal
        isOpen={updateIsOpen}
        onClose={updateOnClose}
        initialFocusRef={initialFocusRef}
        motionPreset="slideInBottom"
      >
        <ModalOverlay />
        <ModalContent pb={4}>
          <Formik
            validateOnBlur={false}
            initialValues={{
              role: editingUserRole,
              userName: editingUserName,
            }}
            onSubmit={async (values) => {
              // Submit update role mutation
              await updateUserRole({
                variables: {
                  orgId: orgId,
                  role: values.role,
                  userName: values.userName,
                },
              })
            }}
          >
            {({ handleSubmit, isSubmitting }) => (
              <form id="form" onSubmit={handleSubmit}>
                <ModalHeader>
                  <Stack isInline align="center">
                    <Trans>Edit Role</Trans>
                  </Stack>
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  <Stack isInline align="center">
                    <Text fontWeight="bold">
                      <Trans>User:</Trans>
                    </Text>
                    <Text>{editingUserName}</Text>
                  </Stack>

                  <Divider />
                  <Stack isInline align="center">
                    <FormLabel htmlFor="role_select" fontWeight="bold">
                      <Trans>Role:</Trans>
                    </FormLabel>
                    <Select
                      w="35%"
                      id="role_select"
                      size="sm"
                      name="role"
                      defaultValue={editingUserRole}
                      onChange={(e) => setEditingUserRole(e.target.value)}
                    >
                      {(editingUserRole === 'USER' ||
                        (permission === 'SUPER_ADMIN' &&
                          editingUserRole === 'ADMIN')) && (
                        <option value="USER">{t`USER`}</option>
                      )}
                      {(editingUserRole === 'USER' ||
                        editingUserRole === 'ADMIN') && (
                        <option value="ADMIN">{t`ADMIN`}</option>
                      )}
                      {(editingUserRole === 'SUPER_ADMIN' ||
                        (permission === 'SUPER_ADMIN' &&
                          orgSlug === 'super-admin')) && (
                        <option value="SUPER_ADMIN">{t`SUPER_ADMIN`}</option>
                      )}
                    </Select>
                  </Stack>
                </ModalBody>

                <ModalFooter>
                  <Button
                    variant="primary"
                    isLoading={isSubmitting}
                    type="submit"
                    mr="4"
                  >
                    <Trans>Confirm</Trans>
                  </Button>
                </ModalFooter>
              </form>
            )}
          </Formik>
        </ModalContent>
      </Modal>
    </Flex>
  )
}

UserList.propTypes = {
  orgSlug: string,
  permission: string,
  usersPerPage: number,
  orgId: string.isRequired,
}
