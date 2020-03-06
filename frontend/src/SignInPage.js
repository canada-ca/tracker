/* eslint-disable react/prop-types */
import React from 'react';
import { Text, Input, InputGroup, InputRightElement, FormErrorMessage, FormControl, Stack, Button, Link } from '@chakra-ui/core'
import { Link as RouteLink } from 'react-router-dom'
import { useMutation } from "@apollo/react-hooks";
import gql from 'graphql-tag'
import { Formik, Field } from "formik";


export function SignInPage(){
    const [show, setShow] = React.useState(false);
    const handleClick = () => setShow(!show);

    const [signIn, { loading, error, data }] = useMutation(gql`
    mutation SignIn($userName: EmailAddress!, $password: String!) {
      signIn(userName: $userName, password: $password) {
        user {
          userName
          failedLoginAttempts
        }
        authToken
      }
    }
  `)

  if (loading) return <p>Loading...</p>
  if (error) return <p>{String(error)}</p>

  if (data){
    if(data.error){
      console.log(error);
    }
    console.log(data.signIn)
    // Do something with the data.  Ie: Redirect if no error?
  }

  function validateField(value){
    let error;
    if(!value || value === ""){
      error = "Field can not be empty";
    }
    return error;
  }

  return(
      <Stack spacing={4} mx="auto">
        <Text fontSize="2xl">Sign in with your username and password.</Text>

        <Formik
          initialValues={{ email: "", password: ""}}
          onSubmit={(values, actions) => {
            setTimeout(() => {
              console.log(values) // TODO: Remove when testing is done
              signIn({variables: {userName:values.email, password:values.password}});
              actions.setSubmitting(false);
            }, 500);
          }}>

          {props => (
            <form onSubmit={props.handleSubmit}>

              <Field name="email" validate={validateField}>
                {({ field, form}) => (
                  <FormControl mt={4} mb={4} isInvalid={form.errors.email && form.touched.email} isRequired>
                    <Input {...field} id="email" placeholder="Email" />
                    <FormErrorMessage>{form.errors.email}</FormErrorMessage>
                  </FormControl>
                )}
              </Field>

              <Field name="password" validate={validateField}>
                {({ field, form}) => (
                  <FormControl mb={2} isInvalid={form.errors.password && form.touched.password} isRequired>
                    <InputGroup size="md">
                      <Input
                        {...field}
                        pr="4.5rem"
                        type={show ? "text" : "password"}
                        placeholder="Password"
                        id="password"
                      />
                      <InputRightElement width="4.5rem">
                        <Button h="1.75rem" size="sm" onClick={handleClick}>
                          {show ? "Hide" : "Show"}
                        </Button>
                      </InputRightElement>
                    </InputGroup>
                    <FormErrorMessage>{form.errors.password}</FormErrorMessage>
                  </FormControl>
                )}
              </Field>
              <Link as={RouteLink} to="/forgot-password">Forgot?</Link>

              <Stack mt={6} spacing={4} isInline>
                <Button
                  variantColor="teal"
                  isLoading={props.isSubmitting}
                  type="submit"
                >
                  Sign In
                </Button>

                <Button as={RouteLink} to="/create-user"variantColor="teal" variant="outline">
                    Create Account
                </Button>

              </Stack>

            </form>

          )}
        </Formik>

      </Stack>
  )
}
