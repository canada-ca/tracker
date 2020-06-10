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
  Heading,
} from '@chakra-ui/core'
import { Trans } from '@lingui/macro'
import UserList from './UserList'
import DomainsPage from './DomainsPage'
import { Layout } from './Layout'

export default function AdminPage() {
  return (
    <Layout>
      <Stack spacing={4}>
        <SimpleGrid columns={{ lg: 2 }} spacing="60px" width="100%">
          <Stack spacing={4}>
            <Text fontSize="2xl" fontWeight="bold">
              Admin Profile
            </Text>
            <Text>Name: $displayname </Text>
            <Text>Email: $email</Text>
            <Text>Organization(s): $organizations </Text>
          </Stack>
          <Stack spacing={4}>
            <Text fontSize="2xl" fontWeight="bold">
              Organization Profile
            </Text>
            <Text>Name: $orgname</Text>
            <Text>Location: $location</Text>
            <Text>Admins: $adminlist</Text>
            <Text>Member Count: $membercount</Text>
          </Stack>
          <DomainsPage />
          <UserList />
        </SimpleGrid>
      </Stack>
    </Layout>
  )
}
