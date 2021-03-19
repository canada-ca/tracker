import React, { useState } from 'react'
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
} from '@chakra-ui/core'
import { Trans, t } from '@lingui/macro'
import { i18n } from '@lingui/core'
import { UserCard } from './UserCard'
import { number, string } from 'prop-types'
import { useMutation } from '@apollo/client'
import { INVITE_USER_TO_ORG, UPDATE_USER_ROLE } from './graphql/mutations'
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

  const addUserValidationSchema = object().shape({
    userName: yupString()
      .required(i18n._(fieldRequirements.email.required.message))
      .email(i18n._(fieldRequirements.email.email.message)),
  })

  const {
    loading,
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
      } else if (updateUserRole.result.__typename === 'UpdateUserRoleError') {
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
            status: 'info',
            duration: 9000,
            isClosable: true,
            position: 'top-left',
          })
        } else if (
          inviteUserToOrg.result.__typename === 'InviteUserToOrgError'
        ) {
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

  if (loading)
    return (
      <LoadingMessage>
        <Trans>User List</Trans>
      </LoadingMessage>
    )
  if (error) return <ErrorFallbackMessage error={error} />

  // TODO: Add mutation to this
  // const removeUser = (user) => {
  //   console.log(user)
  //   const temp = userList.filter((c) => c.node.userId !== user.userId)
  //   if (temp) {
  //     setUserList(temp)
  //     if (currentUsers.length <= 1 && userList.length > 1)
  //       setCurrentPage(Math.ceil(userList.length / usersPerPage) - 1)
  //     toast({
  //       title: 'User removed',
  //       description: `${user.user.userName} was removed from ${orgName}`,
  //       status: 'info',
  //       duration: 9000,
  //       isClosable: true,
  //       position: 'top-left',
  //     })
  //   } else {
  //     toast({
  //       title: 'An error occurred.',
  //       description: `${user.displayName} could not be removed from ${orgName}`,
  //       status: 'error',
  //       duration: 9000,
  //       isClosable: true,
  //       position: 'top-left',
  //     })
  //   }
  // }

  const handleClick = (role, userName) => {
    updateUserRole({
      variables: {
        orgId: orgId,
        role: role,
        userName: userName,
      },
    })
  }

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
      <Text fontSize="2xl" fontWeight="bold">
        <Trans>User List</Trans>
      </Text>

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
              mb="8px"
              alignItems="center"
              w={permission ? '100%' : ['100%', '50%']}
              isInline
            >
              <InputGroup flexGrow={1}>
                <InputLeftElement>
                  <Icon name="search" color="gray.300" />
                </InputLeftElement>
                <Input
                  as={Field}
                  type="email"
                  name="userName"
                  placeholder={t`Search for a user`}
                  isDisabled={addUserLoading}
                />
              </InputGroup>

              <Field
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
              w={permission ? '100%' : ['100%', '50%']}
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
          </form>
        )}
      </Formik>

      {nodes.length === 0 ? (
        <Text fontSize="2xl" fontWeight="bold" textAlign="center">
          <Trans>No users in this organization</Trans>
        </Text>
      ) : (
        nodes.map((node) => {
          let userRole = node.permission
          return (
            <Box key={`${node.user.userName}:${node.id}`}>
              <Stack isInline align="center">
                {/* TODO: IMPLEMENT USER REMOVAL (NEEDS API SUPPORT NOV-23-2020 */}
                {/* <TrackerButton */}
                {/*   variant="danger" */}
                {/*   onClick={() => removeUser(node)} */}
                {/*   px="3" */}
                {/* > */}
                {/*   <Icon name="minus" /> */}
                {/* </TrackerButton> */}
                <UserCard userName={node.user.userName} role={userRole} />
              </Stack>
              <Stack isInline justifyContent="flex-end" align="center">
                <FormLabel htmlFor="role_select" fontWeight="bold">
                  <Trans>Role:</Trans>
                </FormLabel>
                <Select
                  w="35%"
                  id="role_select"
                  size="sm"
                  name="role"
                  defaultValue={userRole}
                  onChange={(e) => (userRole = e.target.value)}
                >
                  {/* TODO: Implement this conditional rendering in a cleaner way */}
                  {(userRole === 'USER' ||
                    (permission === 'SUPER_ADMIN' && userRole === 'ADMIN')) && (
                    <option value="USER">{t`USER`}</option>
                  )}
                  {(userRole === 'USER' || userRole === 'ADMIN') && (
                    <option value="ADMIN">{t`ADMIN`}</option>
                  )}
                  {(userRole === 'SUPER_ADMIN' ||
                    permission === 'SUPER_ADMIN') && (
                    <option value="SUPER_ADMIN">{t`SUPER_ADMIN`}</option>
                  )}
                </Select>
                <TrackerButton
                  onClick={() => handleClick(userRole, node.user.userName)}
                  variant="primary"
                  fontSize="sm"
                  px="3"
                >
                  <Trans>Apply</Trans>
                </TrackerButton>
              </Stack>
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
      />
    </Stack>
  )
}

UserList.propTypes = {
  orgSlug: string,
  permission: string,
  usersPerPage: number,
  orgId: string.isRequired,
}
