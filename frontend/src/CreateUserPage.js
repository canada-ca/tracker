/* eslint-disable react/prop-types */
import React from 'react'
import {
  Button,
  FormControl, FormErrorMessage,
  Input, Stack,
  Text,
} from "@chakra-ui/core";
import gql from 'graphql-tag'
import { useMutation } from "@apollo/react-hooks";
import { Link as RouteLink } from "react-router-dom";
import { Field, Formik } from "formik";

export function CreateUserPage(){
    const [createUser, { loading, error, data }] = useMutation(gql`
    mutation CreateUser($displayName: String!, $userName: EmailAddress!, $password: String!, $confirmPassword: String!) {
      createUser(displayName: $displayName, userName: $userName, password: $password, confirmPassword: $confirmPassword) {
        user {
          userName
          failedLoginAttempts
        }
      }
    }
  `)

  if (loading) return <p>Loading...</p>
  if (error) return <p>{String(error)}</p>

  if (data){
    if(data.error){
      console.log(error);
    }

    /* Check that a user's 2fa needs validation before this redirection.
    return <Redirect to={{
      pathname: '/two-factor-code',
      state: {userName: data.createUser.userName},
    }}/> */
  }

  /* A function for the Formik to validate fields in the form */
  function validateField(value){
    let error;
    if(!value || value === ""){
      error = "Field can not be empty";
    }
    return error;
  }

  return (
      <Stack spacing={2} mx="auto">
        <Text mb={4} fontSize="2xl">Create an account by entering an email and password.</Text>
        <Formik
          initialValues={{ email: "", password: "", confirmPassword: ""}}
          onSubmit={(values, actions) => {
            setTimeout(() => {
              createUser({variables: {userName:values.email, password:values.password, confirmPassword:values.confirmPassword, displayName:values.email}});
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
                  <FormControl mt={4} mb={4} isInvalid={form.errors.password && form.touched.password} isRequired>
                    <Input {...field} id="password" placeholder="Password" />
                    <FormErrorMessage>{form.errors.password}</FormErrorMessage>
                  </FormControl>
                )}
              </Field>

              <Field name="confirmPassword" validate={validateField}>
                {({ field, form}) => (
                  <FormControl mt={4} mb={4} isInvalid={form.errors.confirmPassword && form.touched.confirmPassword} isRequired>
                    <Input {...field} id="confirmPassword" placeholder="Confirm password" />
                    <FormErrorMessage>{form.errors.confirmPassword}</FormErrorMessage>
                  </FormControl>
                )}
              </Field>

              <Stack mt={6} spacing={4} isInline>
                <Button
                  variantColor="teal"
                  isLoading={props.isSubmitting}
                  type="submit"
                >
                  Create Account
                </Button>

                <Button as={RouteLink} to="/sign-in" variantColor="teal" variant="outline">
                    Back
                </Button>

              </Stack>

            </form>

          )}
        </Formik>
      </Stack>
  )
}
