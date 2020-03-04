import React from 'react';
import { Text, Input, InputGroup, InputRightElement, FormControl, FormLabel, Stack, Button, Link } from '@chakra-ui/core'
import {Link as RouteLink} from 'react-router-dom'

export function SignInPage(){
    const [show, setShow] = React.useState(false);
    const handleClick = () => setShow(!show);

  return(
      <Stack spacing={2} mx="auto">
        <Text mb={4} fontSize="2xl">Sign in with your username and password.</Text>
        <FormControl>
          <FormLabel htmlFor="email">Email address:</FormLabel>
          <Input type="email" id="email" placeholder="Enter email"/>
        </FormControl>
        <FormControl>
          <FormLabel htmlFor="password">Password:</FormLabel>
          <InputGroup size="md">
          <Input
          pr="4.5rem"
          type={show ? "text" : "password"}
          placeholder="Enter password"
          />
          <InputRightElement width="4.5rem">
          <Button h="1.75rem" size="sm" onClick={handleClick}>{show ? "Hide" : "Show"}</Button>
          </InputRightElement>
          </InputGroup>
        </FormControl>

        <Stack mt={6} isInline spacing={2}>

          <Button variantColor="teal" size="md">Sign In</Button>

          <Button variantColor="teal" variant="outline">
            <Link as={RouteLink} to="/create_user">
              Create Account
            </Link>
          </Button>

          <Button variantColor="teal" variant="outline">
            <Link as={RouteLink} to="/">
              Forgot Password?
            </Link>
          </Button>

        </Stack>
      </Stack>
  )

}
