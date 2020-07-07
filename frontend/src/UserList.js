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
} from '@chakra-ui/core'
import { Trans, t } from '@lingui/macro'
import { PaginationButtons } from './PaginationButtons'
import { UserCard } from './UserCard'
import { string, object } from 'prop-types'

export default function UserList({ ...props }) {
  const { name, userListData, orgName } = props
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

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  const addUser = (name, id) => {
    if (name !== '') {
      const newUser = {
        node: {
          id: id,
          userName: `${name}${id}@gmail.com`,
          admin: false,
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
      })
    } else {
      toast({
        title: 'An error occurred.',
        description: 'Search for a user to add them',
        status: 'error',
        duration: 9000,
        isClosable: true,
      })
    }
  }

  const removeUser = (user) => {
    const temp = userList.filter((c) => c.node.id !== user.id)

    if (temp) {
      setUserList(temp)
      toast({
        title: 'User removed',
        description: `${user.displayName} was removed from ${orgName}`,
        status: 'info',
        duration: 9000,
        isClosable: true,
      })
    } else {
      toast({
        title: 'User removal failed',
        description: `${user.displayName} could not be removed from ${orgName}`,
        status: 'error',
        duration: 9000,
        isClosable: true,
      })
    }
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
          width={'70%'}
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
          return (
            <Stack isInline key={node.id} align="center">
              {name === 'admin' && (
                <Stack isInline>
                  <IconButton
                    icon="minus"
                    size="sm"
                    variantColor="red"
                    isDisabled={node.admin}
                    onClick={() => removeUser(node)}
                  />
                  <IconButton
                    icon="edit"
                    size="sm"
                    variantColor="blue"
                    onClick={() => window.alert('edit user')}
                    isDisabled={node.admin}
                  />
                </Stack>
              )}

              <UserCard
                userName={node.userName}
                tfa={node.tfa}
                admin={node.admin}
                displayName={node.displayName}
              />
            </Stack>
          )
        })
      )}
      <Divider />
      {userList.length > usersPerPage && (
        <Stack>
          <PaginationButtons
            perPage={usersPerPage}
            total={userList.length}
            paginate={paginate}
          />
          <Text>
            Page {currentPage} of {Math.ceil(userList.length / usersPerPage)}
          </Text>
        </Stack>
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
  userListData: object,
  orgName: string,
  name: string,
}
