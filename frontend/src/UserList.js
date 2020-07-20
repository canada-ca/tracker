import React, { useState } from 'react'
import { useLingui } from '@lingui/react'
import {
  Stack,
  SimpleGrid,
  Divider,
  Button,
  Icon,
  InputGroup,
  InputLeftElement,
  Input,
  Text,
  IconButton,
  useToast,
  Select,
} from '@chakra-ui/core'
import { Trans, t } from '@lingui/macro'
import { PaginationButtons } from './PaginationButtons'
import { UserCard } from './UserCard'
import { string, object } from 'prop-types'
import { useMutation } from '@apollo/react-hooks'
import { UPDATE_USER_ROLES } from './graphql/mutations'
import { Formik } from 'formik'

export default function UserList({ ...props }) {
  const { name, userListData, orgName, orgSlug } = props
  const [userList, setUserList] = useState(userListData.userList.edges)
  const [currentPage, setCurrentPage] = useState(1)
  const [usersPerPage] = useState(4)
  const [userSearch, setUserSearch] = useState('')
  const toast = useToast()
  const { i18n } = useLingui()

  // Get current users
  const indexOfLastUser = currentPage * usersPerPage
  const indexOfFirstUser = indexOfLastUser - usersPerPage
  const currentUsers = userList.slice(indexOfFirstUser, indexOfLastUser)

  const [updateUserRoles, { loading, error }] = useMutation(UPDATE_USER_ROLES, {
    onError(error) {
      console.log(error)
      toast({
        title: i18n._(t`An error occurred.`),
        description: i18n._(t`Unable to change user role, please try again.`),
        status: 'error',
        duration: 9000,
        isClosable: true,
      })
    },
    onCompleted() {
      toast({
        title: i18n._(t`Role updated`),
        description: i18n._(t`Role of USER updated to ROLE`),
        status: 'success',
        duration: 9000,
        isClosable: true,
      })
    },
  })

  if (loading)
    return (
      <p>
        <Trans>Loading...</Trans>
      </p>
    )
  if (error) return <p>{String(error)}</p>

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  const addUser = (name, id) => {
    if (name !== '') {
      const newUser = {
        node: {
          id: id,
          userName: `${name}${id}@gmail.com`,
          role: 'USER_READ',
          tfa: false,
          displayName: name,
        },
      }
      setUserList([...userList, newUser])
      setUserSearch('')
      toast({
        title: 'User added',
        description: `${newUser.node.displayName} was invited to ${orgName}`,
        status: 'info',
        duration: 9000,
        isClosable: true,
        position: 'bottom-left',
      })
    } else {
      toast({
        title: 'An error occurred.',
        description: 'Search for a user to add them',
        status: 'error',
        duration: 9000,
        isClosable: true,
        position: 'bottom-left',
      })
    }
  }

  const removeUser = (user) => {
    const temp = userList.filter((c) => c.node.id !== user.id)
    if (temp) {
      setUserList(temp)
      if (currentUsers.length <= 1)
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

  return (
    <Stack mb={6} w="100%">
      <Text fontSize="2xl" fontWeight="bold">
        <Trans>User List</Trans>
      </Text>
      <SimpleGrid mb={6} columns={{ md: 1, lg: 2 }} spacing="15px">
        <InputGroup>
          <InputLeftElement>
            <Icon name="search" color="gray.300" />
          </InputLeftElement>
          <Input
            type="text"
            placeholder={i18n._(t`Search for a user`)}
            value={userSearch}
            onChange={(e) => {
              setUserSearch(e.target.value)
            }}
          />
        </InputGroup>
        <Button
          leftIcon="add"
          variantColor="blue"
          onClick={() => {
            addUser(userSearch, Math.floor(Math.random() * 1000))
          }}
        >
          <Trans>Invite User</Trans>
        </Button>
      </SimpleGrid>
      <Divider />

      {userList.length === 0 ? (
        <Text fontSize="2xl" fontWeight="bold" textAlign={['center']}>
          <Trans>No users in this organization</Trans>
        </Text>
      ) : (
        currentUsers.map(({ node }) => {
          let userRole = node.role
          return (
            <Stack isInline key={node.id} align="center">
              {name === 'admin' && (
                <Stack isInline>
                  <IconButton
                    icon="minus"
                    size="sm"
                    variantColor="red"
                    onClick={() => removeUser(node)}
                  />
                </Stack>
              )}
              {name === 'admin' ? (
                <Stack spacing={2} isInline align="center">
                  <UserCard
                    userName={node.userName}
                    displayName={node.displayName}
                  />
                  <Select
                    w="30"
                    name="role"
                    defaultValue={userRole}
                    onChange={(e) => {
                      userRole = e.target.value
                    }}
                  >
                    <option value="USER_READ">USER_READ</option>
                    <option value="USER_WRITE">USER_WRITE</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  </Select>
                  <Button
                    variantColor="blue"
                    type="submit"
                    onClick={() => handleClick(userRole, node.userName)}
                    // isDisabled={userRole === node.role}
                  >
                    Apply
                  </Button>
                </Stack>
              ) : (
                <UserCard
                  userName={node.userName}
                  tfa={node.tfa}
                  role={node.role}
                  displayName={node.displayName}
                />
              )}
            </Stack>
          )
        })
      )}
      <Divider />
      <PaginationButtons
        perPage={usersPerPage}
        total={userList.length}
        paginate={paginate}
        currentPage={currentPage}
      />
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
  userListData: object,
  orgName: string,
  name: string,
}
