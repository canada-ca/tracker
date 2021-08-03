import React, { useRef } from 'react'
import {
  Button,
  Divider,
  // FormControl,
  // FormErrorMessage,
  FormLabel,
  // Grid,
  // IconButton,
  // Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  useToast,
  Select,
} from '@chakra-ui/react'
import { t, Trans } from '@lingui/macro'
import { bool, func, object, string } from 'prop-types'
import { Formik } from 'formik'
import { UPDATE_USER_ROLE, INVITE_USER_TO_ORG } from './graphql/mutations'
import { useMutation } from '@apollo/client'

export function UserListModal({
  isOpen,
  onClose,
  validationSchema,
  orgId,
  editingUserRole,
  editingUserName,
  orgSlug,
  mutation,
  permission,
}) {
  const toast = useToast()
  const initialFocusRef = useRef()

  const [addUser, { loading: _addUserLoading }] = useMutation(
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
            description: t`Email invitation sent to ${editingUserName}`,
            status: 'success',
            duration: 9000,
            isClosable: true,
            position: 'top-left',
          })
          onClose()
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
        onClose()
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
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
          validationSchema={validationSchema}
          onSubmit={async (values) => {
            // Submit update role mutation
            if (mutation === 'update') {
              await updateUserRole({
                variables: {
                  orgId: orgId,
                  role: values.role,
                  userName: values.userName,
                },
              })
            } else if (mutation === 'create') {
              await addUser({
                variables: {
                  orgId: orgId,
                  requestedRole: values.role,
                  userName: values.userName,
                  preferredLang: 'ENGLISH',
                },
              })
            }
          }}
        >
          {({ handleSubmit, handleChange, isSubmitting }) => (
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
                    onChange={handleChange}
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
  )
}

UserListModal.propTypes = {
  isOpen: bool,
  onClose: func,
  validationSchema: object,
  orgId: string,
  editingUserRole: string,
  editingUserName: string,
  orgSlug: string,
  mutation: string,
  permission: string,
}
