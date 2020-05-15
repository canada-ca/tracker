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
} from '@chakra-ui/core'
import { Trans } from '@lingui/macro'
import { QUERY_USERLIST } from './graphql/queries'
import { useQuery } from '@apollo/react-hooks'
import { PaginationButtons } from './PaginationButtons'
import { UserCard } from './UserCard'
import { useUserState } from './UserState'
import { slugify } from './slugify'

export default function UserList() {
  const { currentUser } = useUserState()
  // This function generates the URL when the page loads
  const { loading, error, data } = useQuery(QUERY_USERLIST, {
    context: {
      headers: {
        authorization: currentUser.jwt,
      },
    },
    variables: {
      slug: slugify(currentUser.userName),
    },
  })
  if (loading) {
    return <p>Loading...</p>
  }
  if (error) {
    console.log(error)
    return <p>Error :(</p>
  }

  return (
    <Stack mb={6} w="100%">
      <SimpleGrid mb={6} columns={{ md: 1, lg: 2 }} spacing="15px">
        <InputGroup>
          <InputLeftElement>
            <Icon name="search" color="gray.300" />
          </InputLeftElement>
          <Input type="text" placeholder="Search for user" />
        </InputGroup>
        <Button
          width={['100%', '40%']}
          leftIcon="add"
          variantColor="blue"
          onClick={() => {
            window.alert('create user')
          }}
        >
          <Trans>Create User</Trans>
        </Button>
      </SimpleGrid>
      <Divider />
      {data.userList.edges.map(({ node }) => {
        return (
          <UserCard
            key={node.id}
            userName={node.userName}
            tfa={node.tfa}
            admin={node.admin}
            displayName={node.displayName}
          />
        )
      })}
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
