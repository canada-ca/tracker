import React, { useRef, useState } from 'react'
import {
  FormLabel,
  Stack,
  Icon,
  InputGroup,
  InputLeftElement,
  Input,
  Text,
  useToast,
  Select,
  Box,
  useDisclosure,
  SlideIn,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Divider,
} from '@chakra-ui/core'
import { Trans, t } from '@lingui/macro'
import { i18n } from '@lingui/core'
import { UserCard } from './UserCard'
import { number, string } from 'prop-types'
import { useMutation } from '@apollo/client'
import {
  INVITE_USER_TO_ORG,
  REMOVE_USER_FROM_ORG,
  UPDATE_USER_ROLE,
} from './graphql/mutations'
import { TrackerButton } from './TrackerButton'
import { useUserState } from './UserState'
import { Field, Formik } from 'formik'
import { fieldRequirements } from './fieldRequirements'
import { object, string as yupString } from 'yup'
import { LoadingMessage } from './LoadingMessage'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'
import { usePaginatedCollection } from './usePaginatedCollection'
import { PAGINATED_ORG_AFFILIATIONS_ADMIN_PAGE as FORWARD } from './graphql/queries'
import { RelayPaginationControls } from './RelayPaginationControls'

export default function UserList({ permission, orgSlug, usersPerPage, orgId }) {
  const toast = useToast()
  const { currentUser } = useUserState()
  const [addedUserName, setAddedUserName] = useState()
  const [selectedRemoveUser, setSelectedRemoveUser] = useState()

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
  const addUserValidationSchema = object().shape({
    userName: yupString()
      .required(i18n._(fieldRequirements.email.required.message))
      .email(i18n._(fieldRequirements.email.email.message)),
  })

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
    fetchHeaders: { authorization: currentUser.jwt },
    recordsPerPage: usersPerPage,
    variables: { orgSlug },
    relayRoot: 'findOrganizationBySlug.affiliations',
  })

  const [
    updateUserRole,
    { loading: _updateLoading, error: _updateError },
  ] = useMutation(UPDATE_USER_ROLE, {
    context: {
      headers: {
        authorization: currentUser.jwt,
      },
    },
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
      context: {
        headers: {
          authorization: currentUser.jwt,
        },
      },
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
      context: { headers: { authorization: currentUser.jwt } },
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

  if (loading)
    return (
      <LoadingMessage>
        <Trans>User List</Trans>
      </LoadingMessage>
    )
  if (error) return <ErrorFallbackMessage error={error} />

  const showErrorToast = (error) =>
    toast({
      title: t`An error occurred.`,
      description: error,
      status: 'error',
      duration: 9000,
      isClosable: true,
      position: 'top-left',
    })

  return (
    <Stack mb="6" w="100%">
      <Formik
        validationSchema={addUserValidationSchema}
        initialValues={{ userName: '', roleSelect: 'USER' }}
        initialErrors={{ userName: 'Email cannot be empty' }}
        onSubmit={(values) => {
          addUser({
            variables: {
              userName: values.userName,
              requestedRole: values.roleSelect,
              orgId: orgId,
              preferredLang: 'ENGLISH',
            },
          })
        }}
      >
        {({ handleSubmit, values, errors }) => (
          <form id="form" onSubmit={handleSubmit} noValidate>
            <Stack
              align="center"
              w="100%"
              flexDirection={['column', 'row']}
              isInline
              mb="2"
            >
              <Stack
                isInline
                w="100%"
                align="center"
                mb={['2', '0']}
                mr={['0', '2']}
              >
                <InputGroup flexGrow={1} w="50%">
                  <InputLeftElement>
                    <Icon name="email" color="gray.300" />
                  </InputLeftElement>
                  <Input
                    as={Field}
                    type="email"
                    name="userName"
                    placeholder={t`New user email`}
                    isDisabled={addUserLoading}
                  />
                </InputGroup>

                <Field
                  w="25%"
                  as={Select}
                  flexBasis="7rem"
                  flexShrink={0}
                  id="roleSelect"
                  name="roleSelect"
                >
                  <option value="USER">{t`USER`}</option>
                  <option value="ADMIN">{t`ADMIN`}</option>
                </Field>
              </Stack>

              <TrackerButton
                w={['100%', '25%']}
                variant="primary"
                type="submit"
                onClick={() => {
                  setAddedUserName(values.userName)
                  if (errors.userName) showErrorToast(errors.userName)
                }}
              >
                <Icon name="add" />
                <Trans>Invite User</Trans>
              </TrackerButton>
            </Stack>
          </form>
        )}
      </Formik>

      {nodes.length === 0 ? (
        <Text fontSize="2xl" fontWeight="bold" textAlign="center">
          <Trans>No users in this organization</Trans>
        </Text>
      ) : (
        nodes.map((node) => {
          const userRole = node.permission
          return (
            <Box key={`${node.user.userName}:${node.id}`}>
              <Stack isInline align="center">
                <Stack>
                  <TrackerButton
                    aria-label="userEditButton"
                    variant="primary"
                    px="2"
                    onClick={() => {
                      setEditingUserRole(userRole)
                      setEditingUserName(node.user.userName)
                      updateOnOpen()
                    }}
                  >
                    <Icon name="edit" />
                  </TrackerButton>
                  <TrackerButton
                    variant="danger"
                    onClick={() => {
                      setSelectedRemoveUser(node.user)
                      removeOnOpen()
                    }}
                    px="2"
                  >
                    <Icon name="minus" />
                  </TrackerButton>
                </Stack>
                <UserCard userName={node.user.userName} role={userRole} />
              </Stack>
              <Divider borderColor="gray.900" />
            </Box>
          )
        })
      )}
      <RelayPaginationControls
        onlyPagination={true}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
        next={next}
        previous={previous}
        isLoadingMore={isLoadingMore}
      />

      <SlideIn in={removeIsOpen}>
        {(styles) => (
          <Modal isOpen={true} onClose={removeOnClose}>
            <ModalOverlay opacity={styles.opacity} />
            <ModalContent pb={4} {...styles}>
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
                <TrackerButton
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
                </TrackerButton>
              </ModalFooter>
            </ModalContent>
          </Modal>
        )}
      </SlideIn>

      <SlideIn in={updateIsOpen}>
        {(styles) => (
          <Modal
            isOpen={true}
            onClose={updateOnClose}
            initialFocusRef={initialFocusRef}
          >
            <ModalOverlay opacity={styles.opacity} />
            <ModalContent pb={4} {...styles}>
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
                            permission === 'SUPER_ADMIN') && (
                            <option value="SUPER_ADMIN">{t`SUPER_ADMIN`}</option>
                          )}
                        </Select>
                      </Stack>
                    </ModalBody>

                    <ModalFooter>
                      <TrackerButton
                        variant="primary"
                        isLoading={isSubmitting}
                        type="submit"
                        mr="4"
                      >
                        <Trans>Confirm</Trans>
                      </TrackerButton>
                    </ModalFooter>
                  </form>
                )}
              </Formik>
            </ModalContent>
          </Modal>
        )}
      </SlideIn>
    </Stack>
  )
}

UserList.propTypes = {
  orgSlug: string,
  permission: string,
  usersPerPage: number,
  orgId: string.isRequired,
}
