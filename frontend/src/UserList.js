import React, { useState } from 'react'
import { useLingui } from '@lingui/react'
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
import { INVITE_USER_TO_ORG, UPDATE_USER_ROLES } from './graphql/mutations'
import { TrackerButton } from './TrackerButton'
import { useUserState } from './UserState'
import { Field, Formik } from 'formik'
import { fieldRequirements } from './fieldRequirements'
import { object, string as yupString } from 'yup'

export default function UserList({
  permission,
  userListData,
  orgName,
  orgSlug,
}) {
  let users = []
  if (userListData && userListData.edges) {
    users = userListData.edges
  }

  const [userList, setUserList] = useState(users)
  const [currentPage, setCurrentPage] = useState(1)
  const [usersPerPage] = useState(4)
  const toast = useToast()
  const { i18n } = useLingui()
  const { currentUser } = useUserState()
  const [addedUserName, setAddedUserName] = useState()

  const addUserValidationSchema = object().shape({
    userName: yupString()
      .required(i18n._(fieldRequirements.email.required.message))
      .email(i18n._(fieldRequirements.email.email.message)),
  })

  // Get current users
  const indexOfLastUser = currentPage * usersPerPage
  const indexOfFirstUser = indexOfLastUser - usersPerPage
  const currentUsers = userList.slice(indexOfFirstUser, indexOfLastUser)

  const [updateUserRoles, { loading, error }] = useMutation(UPDATE_USER_ROLES, {
    onError(error) {
      toast({
        title: error.message,
        description: i18n._(t`Unable to change user role, please try again.`),
        status: 'error',
        duration: 9000,
        isClosable: true,
        position: 'bottom-left',
      })
    },
    onCompleted() {
      toast({
        title: i18n._(t`Role updated`),
        description: i18n._(t`The user's role has been successfully updated`),
        status: 'success',
        duration: 9000,
        isClosable: true,
        position: 'bottom-left',
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
          title: i18n._(t`An error occurred.`),
          description: error.message,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'bottom-left',
        })
      },
      onCompleted() {
        toast({
          title: i18n._(t`User invited`),
          description: i18n._(t`Email invitation sent to ${addedUserName}`),
          status: 'info',
          duration: 9000,
          isClosable: true,
          position: 'bottom-left',
        })
      },
    },
  )

  if (loading)
    return (
      <p>
        <Trans>Loading...</Trans>
      </p>
    )
  if (error) return <p>{String(error)}</p>

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  const removeUser = (user) => {
    const temp = userList.filter((c) => c.node.id !== user.id)
    if (temp) {
      setUserList(temp)
      if (currentUsers.length <= 1 && userList.length > 1)
        setCurrentPage(Math.ceil(userList.length / usersPerPage) - 1)
      toast({
        title: 'User removed',
        description: `${user.displayName} was removed from ${orgName}`,
        status: 'info',
        duration: 9000,
        isClosable: true,
        position: 'bottom-left',
      })
    } else {
      toast({
        title: 'An error occurred.',
        description: `${user.displayName} could not be removed from ${orgName}`,
        status: 'error',
        duration: 9000,
        isClosable: true,
        position: 'bottom-left',
      })
    }
  }

  const handleClick = (role, userName) => {
    updateUserRoles({
      variables: {
        input: {
          orgSlug: orgSlug,
          role: role,
          userName: userName,
        },
      },
    })
  }

  const showErrorToast = (error) =>
    toast({
      title: i18n._(t`An error occurred.`),
      description: error,
      status: 'error',
      duration: 9000,
      isClosable: true,
      position: 'bottom-left',
    })

  return (
    <Stack mb="6" w="100%">
      <Text fontSize="2xl" fontWeight="bold">
        <Trans>User List</Trans>
      </Text>

      <Formik
        validationSchema={addUserValidationSchema}
        initialValues={{ userName: '', roleSelect: 'USER_READ' }}
        initialErrors={{ userName: 'Email cannot be empty' }}
        onSubmit={(values) => {
          addUser({
            variables: {
              userName: values.userName,
              requestedRole: values.roleSelect,
              orgSlug: orgSlug,
              preferredLanguage: 'ENGLISH',
            },
          })
        }}
      >
        {({ handleSubmit, values, errors }) => (
          <form id="form" onSubmit={handleSubmit} noValidate>
            <Stack mb="8px" alignItems="center" w="100%" isInline>
              <InputGroup flexGrow={1}>
                <InputLeftElement>
                  <Icon name="search" color="gray.300" />
                </InputLeftElement>
                <Input
                  as={Field}
                  type="email"
                  name="userName"
                  placeholder={i18n._(t`Search for a user`)}
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
                <option value="USER_READ">{i18n._(t`READ`)}</option>
                <option value="USER_WRITE">{i18n._(t`WRITE`)}</option>
                <option value="ADMIN">{i18n._(t`ADMIN`)}</option>
              </Field>
            </Stack>

            <TrackerButton
              width="100%"
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
          let userRole = node.role
          if (permission) {
            return (
              <Box key={`${node.username}:${index}`}>
                {userRole === 'SUPER_ADMIN' ||
                (permission === 'ADMIN' && userRole === 'ADMIN') ? (
                  <Stack key={node.id} isInline align="center">
                    <UserCard
                      userName={node.userName}
                      displayName={node.displayName}
                      role={userRole}
                      tfa={null}
                    />
                  </Stack>
                ) : (
                  <Box key={`${node.username}:${index}`}>
                    <Stack isInline align="center">
                      <TrackerButton
                        variant="danger"
                        onClick={() => removeUser(node)}
                        px="3"
                      >
                        <Icon name="minus" />
                      </TrackerButton>
                      <UserCard
                        userName={node.userName}
                        displayName={node.displayName}
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
                        <option value="USER_READ">{i18n._(t`READ`)}</option>
                        <option value="USER_WRITE">{i18n._(t`WRITE`)}</option>
                        <option value="ADMIN">{i18n._(t`ADMIN`)}</option>
                      </Select>
                      <TrackerButton
                        onClick={() => handleClick(userRole, node.userName)}
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
              key={node.id}
              userName={node.userName}
              tfa={node.tfa}
              role={node.role}
              displayName={node.displayName}
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

/* -- Source code for adding organizations, not being used. --

<Box flexShrink="0" ml={{ md: 4 }} mr={{ md: 4 }} minW="25%">
  <Box mt={2} color="gray.500">
    Orgs:&nbsp;
    {// Populate the user-orgs list.
    edge.node.user.affiliations.edges.map((edge, i, arr) => {
      if (arr.length - 1 === i) {
        return (
          <Text display="inline" key={edge.node.id + i}>
            {edge.node.organization.acronym}
          </Text>
        )
      }
      return (
        <Text display="inline" key={edge.node.id + i}>
          {edge.node.organization.acronym + ' | '}
        </Text>
      )
    })}
  </Box>
</Box> */

UserList.propTypes = {
  userListData: shape({
    id: string,
    userName: string,
    role: string,
    tfa: boolean,
    displayName: string,
  }),
  orgName: string,
  orgSlug: string,
  permission: string,
}
