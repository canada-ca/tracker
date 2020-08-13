import React, { useState } from 'react'
import { useLingui } from '@lingui/react'
import {
  Stack,
  SimpleGrid,
  Divider,
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
import { UPDATE_USER_ROLES } from './graphql/mutations'
import { TrackerButton } from './TrackerButton'

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
  const [userSearch, setUserSearch] = useState('')
  const toast = useToast()
  const { i18n } = useLingui()

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
      })
    },
    onCompleted(updateUserRoles) {
      console.log(updateUserRoles)
      toast({
        title: i18n._(t`Role updated`),
        description: i18n._(t`The user's role has been successfully updated`),
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
  const paginate = pageNumber => setCurrentPage(pageNumber)

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

  const removeUser = user => {
    const temp = userList.filter(c => c.node.id !== user.id)
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

  return (
    <Stack mb="6" w="100%">
      <Text fontSize="2xl" fontWeight="bold">
        <Trans>User List</Trans>
      </Text>
      <SimpleGrid mb="6" columns={{ md: 1, lg: 2 }} spacing="15px">
        <InputGroup>
          <InputLeftElement>
            <Icon name="search" color="gray.300" />
          </InputLeftElement>
          <Input
            type="text"
            placeholder={i18n._(t`Search for a user`)}
            value={userSearch}
            onChange={e => {
              setUserSearch(e.target.value)
            }}
          />
        </InputGroup>
        <TrackerButton
          width={['100%', '75%']}
          variant="primary"
          onClick={() => {
            addUser(userSearch, Math.floor(Math.random() * 1000))
          }}
        >
          {/* <Stack isInline align="center" justifyContent="center"> */}
          <Icon name="add" />
          <Trans>Invite User</Trans>
          {/* </Stack> */}
        </TrackerButton>
      </SimpleGrid>
      <Divider />

      {userList.length === 0 ? (
        <Text fontSize="2xl" fontWeight="bold" textAlign={['center']}>
          <Trans>No users in this organization</Trans>
        </Text>
      ) : (
        currentUsers.map(({ node }) => {
          let userRole = node.role
          if (permission) {
            return (
              <Box>
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
                  <Box>
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
                      <Text fontWeight="bold">
                        <Trans>Role:</Trans>
                      </Text>
                      <Select
                        w="35%"
                        size="sm"
                        name="role"
                        defaultValue={userRole}
                        onChange={e => (userRole = e.target.value)}
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
