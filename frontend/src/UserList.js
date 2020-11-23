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
import { PaginationButtons } from './PaginationButtons'
import { UserCard } from './UserCard'
import { string, shape, boolean } from 'prop-types'
import { useMutation } from '@apollo/client'
import { INVITE_USER_TO_ORG, UPDATE_USER_ROLE } from './graphql/mutations'
import { TrackerButton } from './TrackerButton'
import { useUserState } from './UserState'
import { Field, Formik } from 'formik'
import { fieldRequirements } from './fieldRequirements'
import { object, string as yupString } from 'yup'
import { LoadingMessage } from './LoadingMessage'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'

export default function UserList({ permission, userListData, orgName, orgId }) {
  let users = []
  if (userListData && userListData.edges) {
    users = userListData.edges
  }

  const [userList, setUserList] = useState(users)
  const [currentPage, setCurrentPage] = useState(1)
  const [usersPerPage] = useState(4)
  const toast = useToast()
  const { currentUser } = useUserState()
  const [addedUserName, setAddedUserName] = useState()

  const addUserValidationSchema = object().shape({
    userName: yupString()
      .required(fieldRequirements.email.required.message)
      .email(fieldRequirements.email.email.message),
  })

  // Get current users
  const indexOfLastUser = currentPage * usersPerPage
  const indexOfFirstUser = indexOfLastUser - usersPerPage
  const currentUsers = userList.slice(indexOfFirstUser, indexOfLastUser)

  const [updateUserRole, { loading, error }] = useMutation(UPDATE_USER_ROLE, {
    onError(error) {
      toast({
        title: error.message,
        description: t`Unable to change user role, please try again.`,
        status: 'error',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    },
    onCompleted() {
      toast({
        title: t`Role updated`,
        description: t`The user's role has been successfully updated`,
        status: 'success',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
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
      onCompleted() {
        toast({
          title: t`User invited`,
          description: t`Email invitation sent to ${addedUserName}`,
          status: 'info',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
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

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  // TODO: Add mutation to this
  const removeUser = (user) => {
    console.log(user)
    const temp = userList.filter((c) => c.node.userId !== user.userId)
    if (temp) {
      setUserList(temp)
      if (currentUsers.length <= 1 && userList.length > 1)
        setCurrentPage(Math.ceil(userList.length / usersPerPage) - 1)
      toast({
        title: 'User removed',
        description: `${user.user.userName} was removed from ${orgName}`,
        status: 'info',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    } else {
      toast({
        title: 'An error occurred.',
        description: `${user.displayName} could not be removed from ${orgName}`,
        status: 'error',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    }
  }

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
                <option value="SUPER_ADMIN">{t`SUPER_ADMIN`}</option>
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

      {userList.length === 0 ? (
        <Text fontSize="2xl" fontWeight="bold" textAlign="center">
          <Trans>No users in this organization</Trans>
        </Text>
      ) : (
        currentUsers.map(({ node }, index) => {
          let userRole = node.permission
          if (permission) {
            return (
              <Box key={`${node.user.userName}:${index}`}>
                {userRole === 'SUPER_ADMIN' ||
                (permission === 'ADMIN' && userRole === 'ADMIN') ? (
                  <Stack key={node.userId} isInline align="center">
                    <UserCard
                      userName={node.user.userName}
                      displayName={node.user.displayName}
                      role={userRole}
                      tfa={null}
                    />
                  </Stack>
                ) : (
                  <Box key={`${node.user.username}:${index}`}>
                    <Stack isInline align="center">
                      <TrackerButton
                        variant="danger"
                        onClick={() => removeUser(node)}
                        px="3"
                      >
                        <Icon name="minus" />
                      </TrackerButton>
                      <UserCard
                        userName={node.user.userName}
                        displayName={node.user.displayName}
                      />
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
                        <option value="USER">{t`USER`}</option>
                        <option value="ADMIN">{t`ADMIN`}</option>
                        <option value="SUPER_ADMIN">{t`SUPER_ADMIN`}</option>
                      </Select>
                      <TrackerButton
                        onClick={() =>
                          handleClick(userRole, node.user.userName)
                        }
                        variant="primary"
                        fontSize="sm"
                        px="3"
                      >
                        <Trans>Apply</Trans>
                      </TrackerButton>
                    </Stack>
                  </Box>
                )}
              </Box>
            )
          }
          return (
            <UserCard
              key={node.userId}
              userName={node.user.userName}
              tfa={node.user.tfa}
              role={node.permission}
              displayName={node.user.displayName}
            />
          )
        })
      )}

      {userList.length > 0 && (
        <PaginationButtons
          perPage={usersPerPage}
          total={userList.length}
          paginate={paginate}
          currentPage={currentPage}
        />
      )}
    </Stack>
  )
}

UserList.propTypes = {
  userListData: shape({
    userId: string,
    permission: string,
    user: {
      userName: string,
      tfaValidated: boolean,
      displayName: string,
    },
  }),
  orgName: string,
  orgId: string,
  permission: string,
}
