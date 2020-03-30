import React from 'react'

import {
  Badge,
  Stack,
  SimpleGrid,
  Divider,
  Box,
  Text,
  Button,
  IconButton,
  Icon,
  InputGroup,
  InputLeftElement,
  Input,
} from '@chakra-ui/core'

import gql from 'graphql-tag'
import { useQuery } from '@apollo/react-hooks'

export function UserList() {
  // This function generates the URL when the page loads
  const { loading, error, data } = useQuery(
    gql`
      query Users($org: Acronym!) {
        users(org: $org) {
          edges {
            node {
              userName
              permission
            }
          }
        }
      }
    `,
    { variables: { org: '' } },
  )
  if (loading) {
    return <p>Loading...</p>
  }
  if (error) {
    console.log(error)
  }
  if (data) {
    console.log(data)
  }

  return (
    <Stack mx="auto" mb={6}>
      <SimpleGrid mb={6} columns={{ md: 1, lg: 2 }} spacing="15px">
        <InputGroup>
          <InputLeftElement>
            <Icon name="search" color="gray.300" />
          </InputLeftElement>
          <Input type="text" placeholder="Search for user" />
        </InputGroup>
        <Button
          width={['100%', '30%']}
          leftIcon="add"
          variantColor="blue"
          onClick={() => {
            window.alert('create user')
          }}
        >
          Create User
        </Button>
      </SimpleGrid>
      <Divider />
      <Box
        p={4}
        display={{ md: 'flex' }}
        alignItems="center"
        onClick={() => {
          window.alert('clicked box')
        }}
      >
        <Box flexShrink="0" mr={{ md: 6 }}>
          <Text mt={1} fontSize="lg" fontWeight="semibold">
            Test User
          </Text>
        </Box>
        <Box flexShrink="0" ml={{ md: 6 }} mr={{ md: 6 }}>
          <Text fontSize="lg">testuser@email.gc.ca</Text>
        </Box>
        <Box flexShrink="0" ml={{ md: 6 }} mr={{ md: 6 }}>
          <Badge variantColor="green">Active</Badge>
          <Badge variantColor="red" ml="10px">
            Admin
          </Badge>
        </Box>
        <Box flexShrink="0" ml={{ md: 6 }} mr={{ md: 6 }}>
          <Text mt={2} color="gray.500">
            Orgs: DND | GC | CA
          </Text>
        </Box>
        <Box flexShrink="0" ml={{ md: 6 }} mr={{ md: 6 }}>
          <Text mt={2} color="gray.500">
            Preferred Language: English
          </Text>
        </Box>
        <Box flexShrink="0" ml={{ md: 6 }} mr={{ md: 6 }} mt={2}>
          <Badge variantColor="green">TwoFactor</Badge>
        </Box>
      </Box>
      <Divider />
      <Box
        p={4}
        display={{ md: 'flex' }}
        alignItems="center"
        onClick={() => {
          window.alert('clicked box')
        }}
      >
        <Box flexShrink="0" mr={{ md: 6 }}>
          <Text mt={1} fontSize="lg" fontWeight="semibold">
            Different User
          </Text>
        </Box>
        <Box flexShrink="0" ml={{ md: 6 }} mr={{ md: 6 }}>
          <Text fontSize="lg">differentuser@email.gc.ca</Text>
        </Box>
        <Box flexShrink="0" ml={{ md: 6 }} mr={{ md: 6 }}>
          <Badge variantColor="green">Active</Badge>
          <Badge variantColor="green" ml="10px">
            Admin
          </Badge>
        </Box>
        <Box flexShrink="0" ml={{ md: 6 }} mr={{ md: 6 }}>
          <Text mt={2} color="gray.500">
            Orgs: TEST | CA | DND
          </Text>
        </Box>
        <Box flexShrink="0" ml={{ md: 6 }} mr={{ md: 6 }}>
          <Text mt={2} color="gray.500">
            Preferred Language: English
          </Text>
        </Box>
        <Box flexShrink="0" ml={{ md: 6 }} mr={{ md: 6 }} mt={2}>
          <Badge variantColor="red">TwoFactor</Badge>
        </Box>
      </Box>
      <Divider />
      <Box
        p={4}
        display={{ md: 'flex' }}
        alignItems="center"
        onClick={() => {
          window.alert('clicked box')
        }}
      >
        <Box flexShrink="0" mr={{ md: 6 }}>
          <Text mt={1} fontSize="lg" fontWeight="semibold">
            Test User
          </Text>
        </Box>
        <Box flexShrink="0" ml={{ md: 6 }} mr={{ md: 6 }}>
          <Text fontSize="lg">testuser@email.gc.ca</Text>
        </Box>
        <Box flexShrink="0" ml={{ md: 6 }} mr={{ md: 6 }}>
          <Badge variantColor="green">Active</Badge>
          <Badge variantColor="red" ml="10px">
            Admin
          </Badge>
        </Box>
        <Box flexShrink="0" ml={{ md: 6 }} mr={{ md: 6 }}>
          <Text mt={2} color="gray.500">
            Orgs: DND | GC | CA
          </Text>
        </Box>
        <Box flexShrink="0" ml={{ md: 6 }} mr={{ md: 6 }}>
          <Text mt={2} color="gray.500">
            Preferred Language: English
          </Text>
        </Box>
        <Box flexShrink="0" ml={{ md: 6 }} mr={{ md: 6 }} mt={2}>
          <Badge variantColor="green">TwoFactor</Badge>
        </Box>
      </Box>
      <Divider />
      <Stack isInline justifyContent="end">
        <IconButton
          variantColor="blue"
          aria-label="Previous page"
          icon="arrow-back"
          onClick={() => {
            window.alert('previous page')
          }}
        />
        <IconButton
          variantColor="blue"
          aria-label="Next page"
          icon="arrow-forward"
          onClick={() => {
            window.alert('next page')
          }}
        />
      </Stack>
    </Stack>
  )
}
