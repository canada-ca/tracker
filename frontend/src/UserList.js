import React from 'react'

import {
  Badge,
  Stack,
  SimpleGrid,
  Divider,
  Box,
  Text,
  Button,
  Icon,
  InputGroup,
  InputLeftElement,
  Input,
} from '@chakra-ui/core'

import gql from 'graphql-tag'
import { useQuery } from '@apollo/react-hooks'
import { PaginationButtons } from './PaginationButtons'

export function UserList() {
  // This function generates the URL when the page loads
  const { loading, error, data } = useQuery(
    gql`
      {
        user {
          affiliations {
            edges {
              node {
                organization {
                  acronym
                  affiliatedUsers {
                    pageInfo {
                      hasNextPage
                      hasPreviousPage
                      startCursor
                      endCursor
                    }
                    edges {
                      node {
                        id
                        user {
                          userName
                          displayName
                          tfa
                          lang
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `,
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
    <>
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

        {data
          ? data.user.affiliations.edges[0].node.organization.affiliatedUsers.edges.map(
              edge => {
                return (
                  <Box key={edge.node.id}>
                    <Box
                      p={4}
                      display={{ md: 'flex' }}
                      alignItems="center"
                      onClick={() => {
                        window.alert('clicked box')
                      }}
                    >
                      <Box flexShrink="0" mr={{ md: 4 }} minW="13%">
                        <Text mt={1} fontSize="lg" fontWeight="semibold">
                          {edge.node.user.displayName}
                        </Text>
                      </Box>
                      <Box
                        flexShrink="0"
                        ml={{ md: 4 }}
                        mr={{ md: 4 }}
                        minW="35%"
                      >
                        <Text fontSize="lg">{edge.node.user.userName}</Text>
                      </Box>
                      <Box
                        flexShrink="0"
                        ml={{ md: 4 }}
                        mr={{ md: 4 }}
                        minW="15%"
                      >
                        <Badge variantColor="green">Active</Badge>
                        <Badge
                          variantColor={
                            edge.node.permission === 'ADMIN' ||
                            edge.node.permission === 'SUPER_ADMIN'
                              ? 'green'
                              : 'red'
                          }
                          ml="10px"
                        >
                          Admin
                        </Badge>
                      </Box>
                      <Box
                        flexShrink="0"
                        ml={{ md: 4 }}
                        mr={{ md: 4 }}
                        minW="15%"
                      >
                        <Text mt={2} color="gray.500">
                          Language: {edge.node.user.lang}
                        </Text>
                      </Box>
                      <Box
                        flexShrink="0"
                        ml={{ md: 4 }}
                        mr={{ md: 4 }}
                        mt={2}
                        minW="15%"
                      >
                        <Badge
                          variantColor={edge.node.user.tfa ? 'green' : 'red'}
                        >
                          TwoFactor
                        </Badge>
                      </Box>
                    </Box>
                    <Divider />
                  </Box>
                )
              },
            )
          : null}

        <PaginationButtons
          next={
            data.user.affiliations.edges[0].node.organization.affiliatedUsers
              .pageInfo.hasNextPage
          }
          previous={
            data.user.affiliations.edges[0].node.organization.affiliatedUsers
              .pageInfo.hasPreviousPage
          }
        />
      </Stack>
    </>
  )
}
