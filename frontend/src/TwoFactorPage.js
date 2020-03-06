 /* eslint-disable react/prop-types */
import React from 'react';
import { Stack, Text, FormControl, FormErrorMessage, Input, InputLeftElement, InputGroup, Icon, Button } from "@chakra-ui/core";
import { Formik, Field } from "formik";
import { useMutation } from "@apollo/react-hooks";
import gql from 'graphql-tag'

export function TwoFactorPage(){

  const [validateOTP, { loading, error, data }] = useMutation(gql`
    mutation ValidateTwoFactor($userName: EmailAddress!, $otpCode: String!) {
      authenticateTwoFactor(userName: $userName, otpCode: $otpCode) {
        user {
          userName
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
    console.log(data.authenticateTwoFactor)
    // Do something with the data.  Ie: Redirect if no error?
  }

   /* A function for the Formik to validate fields in the form */
  function validateField(value){
    let error;
    if(!value || value === ""){
      error = "Field can not be empty";
    }
    else if(value.length !== 6){
      error = "Code must be six characters"
    }
    if(value.match(/[a-z]/i)){
      error = "Code must be numbers only"
    }
    return error;
  }

  return(
      <Stack spacing={4} mx="auto">
        <Text fontSize="2xl">Validate your Two-Factor Code</Text>

        <Formik
          initialValues={{ email: "", password: ""}}
          onSubmit={(values, actions) => {
            setTimeout(() => {
              console.log(values) // TODO: Remove when testing is done
              validateOTP({variables: {userName:values.email, otpCode:values.otpCode}});
              actions.setSubmitting(false);
            }, 500);
          }}>

          {props => (
            <form onSubmit={props.handleSubmit}>

              <Field name="otpCode" validate={validateField}>
                {({ field, form}) => (
                  <FormControl mt={4} mb={4} isInvalid={form.errors.otpCode && form.touched.otpCode} isRequired>
                      <InputGroup>
                        {/* eslint-disable-next-line react/no-children-prop */}
                        <InputLeftElement color="gray.300" fontSize="1.2em" children={<Icon name="lock" color="gray.300" />} />
                          <Input {...field} id="otpCode" placeholder="Two-factor code" />
                      </InputGroup>
                    <FormErrorMessage>{form.errors.otpCode}</FormErrorMessage>
                  </FormControl>
                )}
              </Field>

              <Button
                variantColor="teal"
                isLoading={props.isSubmitting}
                type="submit"
              >Verify</Button>

            </form>
          )}
        </Formik>

      </Stack>
  )
}
