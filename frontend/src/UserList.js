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
                        user {
                          userName
                          displayName
                          tfa
                          lang
                          affiliations {
                            edges {
                              node {
                                organization {
                                  acronym
                                }
                                permission
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
          ? data.user[0].affiliations.edges[0].node.organization.affiliatedUsers.edges.map(
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
                      <Box flexShrink="0" mr={{ md: 6 }}>
                        <Text mt={1} fontSize="lg" fontWeight="semibold">
                          {edge.node.user.displayName}
                        </Text>
                      </Box>
                      <Box flexShrink="0" ml={{ md: 6 }} mr={{ md: 6 }}>
                        <Text fontSize="lg">{edge.node.user.userName}</Text>
                      </Box>
                      <Box flexShrink="0" ml={{ md: 6 }} mr={{ md: 6 }}>
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
                      <Box flexShrink="0" ml={{ md: 6 }} mr={{ md: 6 }}>
                        <Text mt={2} color="gray.500">
                          {edge.node.user.affiliations.edges.map(edge => {
                            // TODO: Figure out how to remove the trailing | symbol
                            return edge.node.organization.acronym + ' | '
                          })}
                        </Text>
                      </Box>
                      <Box flexShrink="0" ml={{ md: 6 }} mr={{ md: 6 }}>
                        <Text mt={2} color="gray.500">
                          Preferred Language: {edge.node.user.lang}
                        </Text>
                      </Box>
                      <Box flexShrink="0" ml={{ md: 6 }} mr={{ md: 6 }} mt={2}>
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

        <Stack isInline justifyContent="end">
          <IconButton
            variantColor="blue"
            aria-label="Previous page"
            icon="arrow-back"
            onClick={() => {
              window.alert('previous page')
            }}
            isDisabled={
              // Determine if the previous button should be disabled
              !data.user[0].affiliations.edges[0].node.organization
                .affiliatedUsers.pageInfo.hasPreviousPage
            }
          />
          <IconButton
            role="nextPageButton"
            variantColor="blue"
            aria-label="Next page"
            icon="arrow-forward"
            onClick={() => {
              window.alert('next page')
            }}
            isDisabled={
              // Determine if the next button should be disabled
              !data.user[0].affiliations.edges[0].node.organization
                .affiliatedUsers.pageInfo.hasNextPage
            }
          />
        </Stack>
      </Stack>
    </>
  )
}
