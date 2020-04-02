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
  PseudoBox,
} from '@chakra-ui/core'

import { Trans } from '@lingui/macro'
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
                          affiliations {
                            edges {
                              node {
                                id
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

      {data
        ? data.user.affiliations.edges[0].node.organization.affiliatedUsers.edges.map(
            edge => {
              return (
                <Box key={edge.node.id} width="100%">
                  <PseudoBox
                    display={{ md: 'flex' }}
                    alignItems="center"
                    onClick={() => {
                      window.alert('clicked box')
                    }}
                    _hover={{ borderColor: 'gray.200', bg: 'gray.200' }}
                    p="30px"
                  >
                    <Box flexShrink="0" minW="15%">
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
                      <Text fontSize="lg" minW="10%">
                        {edge.node.user.userName}
                      </Text>
                    </Box>
                    <Box
                      flexShrink="0"
                      ml={{ md: 4 }}
                      mr={{ md: 4 }}
                      minW="25%"
                    >
                      <Box mt={2} color="gray.500">
                        Orgs:&nbsp;
                        {// Populate the user-orgs list.
                        edge.node.user.affiliations.edges.map(
                          (edge, i, arr) => {
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
                          },
                        )}
                      </Box>
                    </Box>
                    <Box
                      flexShrink="0"
                      ml={{ md: 4 }}
                      mr={{ md: 4 }}
                      minW="15%"
                    >
                      <Badge
                        variantColor={edge.node.user.tfa ? 'green' : 'red'}
                        minW="15%"
                      >
                        <Trans>TwoFactor</Trans>
                      </Badge>
                      <Badge
                        variantColor={
                          edge.node.permission === 'ADMIN' ||
                          edge.node.permission === 'SUPER_ADMIN'
                            ? 'green'
                            : 'red'
                        }
                        ml="10px"
                        mr={{ md: 4 }}
                      >
                        <Trans>Admin</Trans>
                      </Badge>
                    </Box>
                    <Box
                      flexShrink="0"
                      ml={{ md: 4 }}
                      mr={{ md: 4 }}
                      mt={2}
                      minW="15%"
                    ></Box>
                  </PseudoBox>
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
  )
}
