import React from 'react'
import {
  Button,
  FormControl,
  FormLabel,
  Input, Link,
  Stack,
  Text,
} from "@chakra-ui/core";
import gql from 'graphql-tag'
import {useMutation} from "@apollo/react-hooks";
import {Link as RouteLink} from "react-router-dom";

export function CreateUserPage(){
    const [createUser, { loading, error, data }] = useMutation(gql`
    mutation CreateUser($displayName: String!, $userName: EmailAddress!, $password: String!, $confirmPassword: String!) {
      createUser(displayName: $displayName, userName: $userName, password: $password, confirmPassword: $confirmPassword) {
        user {
          username
        }
      }
    }
  `)

  if (loading) return <p>Loading...</p>
  if (error) return <p>{String(error)}</p>
  if (data) console.log(data)

  return (
      <Stack spacing={2} mx="auto">
        <Text mb={4} fontSize="2xl">Create an account by entering an email and password.</Text>
        <FormControl>
          <FormLabel htmlFor="email">Email address</FormLabel>
          <Input type="email" id="email" placeholder="Enter email"/>
        </FormControl>
        <FormControl>
          <FormLabel htmlFor="password">Password</FormLabel>
          <Input type="password" id="password" placeholder="Enter password"/>
        </FormControl>
        <FormControl>
          <FormLabel htmlFor="confirmPassword">Confirm Password</FormLabel>
          <Input type="password" id="confirmPassword" placeholder="Confirm password"/>
        </FormControl>
        <Stack mt={6} isInline spacing={2}>

          <Button variantColor="teal" size="md" onClick={() => createUser({
            variables: {
              displayName:"testuser",
              userName:"testemail@testemail.ca",
              password:"qwerty123456",
              confirmPassword:"qwerty123456"},
          })}>Create Account</Button>

          <Button variantColor="teal" variant="outline">
            <Link as={RouteLink} to="/sign_in">
              Back
            </Link>
          </Button>
        </Stack>
      </Stack>
  )
}
