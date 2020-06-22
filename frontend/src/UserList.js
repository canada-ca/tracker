import React from 'react'
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
import { Trans } from '@lingui/macro'
import { PaginationButtons } from './PaginationButtons'
import { UserCard } from './UserCard'
import { object, string } from 'prop-types'

export default function UserList({ ...props }) {
  const { data, orgName } = props
  const [userList, setUserList] = React.useState(data.userList.edges)
  const [userSearch, setUserSearch] = React.useState('')
  const toast = useToast()

  const addUser = (name, id) => {
    if (name !== '') {
      const newUser = {
        node: {
          id: id,
          userName: String(id),
          admin: false,
          tfa: false,
          displayName: name,
        },
      }
      setUserList([...userList, newUser])
      setUserSearch('')
      toast({
        title: 'User added',
        description: `${newUser.node.displayName} was successfully invited to ${orgName}`,
        status: 'success',
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
        description: `${user.displayName} was successfully removed from ${orgName}`,
        status: 'success',
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
        User List
      </Text>
      <SimpleGrid mb={6} columns={{ md: 1, lg: 2 }} spacing="15px">
        <InputGroup>
          <InputLeftElement>
            <Icon name="search" color="gray.300" />
          </InputLeftElement>
          <Input
            type="text"
            placeholder="Search for user"
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
            addUser(userSearch, Math.random())
          }}
        >
          <Trans>Invite User</Trans>
        </Button>
      </SimpleGrid>
      <Divider />

      {userList.length === 0 ? (
        <Text fontSize="2xl" fontWeight="bold" textAlign={['center']}>
          No users in this organization
        </Text>
      ) : (
        userList.map(({ node }) => {
          return (
            <Stack isInline key={node.id} align="center">
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
      <PaginationButtons
        next={data.userList.pageInfo.hasNextPage}
        previous={data.userList.pageInfo.hasPreviousPage}
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
  data: object,
  orgName: string,
}
