import React from 'react';
import { Text, Input, FormControl, FormLabel, Stack, Button } from '@chakra-ui/core'
import {Layout} from "../../Layout";


export function SignInPage(){
  return(
    <Layout>
      <Text mb={4} fontSize="2xl">Sign in with your username and password.</Text>
      <Stack spacing={2}>
        <FormControl>
          <FormLabel htmlFor="email">Email address</FormLabel>
          <Input type="email" id="email" required/>
        </FormControl>
        <FormControl>
          <FormLabel htmlFor="password">Password</FormLabel>
          <Input type="password" id="password" required/>
        </FormControl>
        <Stack isInline spacing={2}>
          <Button variantColor="teal" size="md">Sign In</Button>
          <Button variantColor="teal" variant="outline">Forgot Password</Button>
        </Stack>
      </Stack>
    </Layout>
  )

}
