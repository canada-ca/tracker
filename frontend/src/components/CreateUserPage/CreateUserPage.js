import React from 'react'
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Text,
} from "@chakra-ui/core";
import {Layout} from "../../Layout";
import gql from 'graphql-tag'
import {useMutation} from "@apollo/react-hooks";

export function CreateUserPage(){
    const [createUser, { loading, error, data }] = useMutation(gql`
    mutation{
      createUser(displayName:"testuser", userName:"test@test-email.ca", password:"password123123", confirmPassword:"password123123"){
        user{
          userName
        }
      }
    }
  `)

  if (loading) return <p>Loading...</p>
  if (error) return <p>{String(error)}</p>
  if(data) return <p>{data.createUser.user.userName}</p>

  return (
    <Layout>
      <Text mb={4} fontSize="2xl">Data: {data}</Text>
      <Stack spacing={2}>
        <FormControl>
          <FormLabel htmlFor="email">Email address</FormLabel>
          <Input type="email" id="email" required/>
        </FormControl>
        <FormControl>
          <FormLabel htmlFor="password">Password</FormLabel>
          <Input type="password" id="password" required/>
        </FormControl>
        <FormControl>
          <FormLabel htmlFor="confirmPassword">Confirm Password</FormLabel>
          <Input type="password" id="confirmPassword" required/>
        </FormControl>
        <Stack isInline spacing={2}>
          <Button variantColor="teal" size="md" onClick={() => createUser()}>Create Account</Button>
        </Stack>
      </Stack>
    </Layout>
  )
}
