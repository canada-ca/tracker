import React from 'react'

import { useFormik, Formik } from 'formik'
import { useHistory } from 'react-router-dom'

import {
  Stack,
  SimpleGrid,
  Button,
  Text,
  Select,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Divider,
  Checkbox,
  CheckboxGroup,
  useToast,
} from '@chakra-ui/core'
import { useApolloClient } from '@apollo/react-hooks'
import { PasswordConfirmation } from './PasswordConfirmation'

export function UserPage() {
  const client = useApolloClient()
  const toast = useToast()
  const history = useHistory()

  const userDetailsFormik = useFormik({
    initialValues: {
      email: 'steve@email.gc.ca',
      lang: 'select option',
      displayName: 'steve',
    },
    onSubmit: values => {
      window.alert(JSON.stringify(values, null, 2))
    },
  })
  return (
    <SimpleGrid columns={{ md: 1, lg: 2 }} spacing="60px" width="100%">
      <form onSubmit={userDetailsFormik.handleSubmit}>
        <Stack p={25} spacing={4}>
          <Text fontSize="2xl" fontWeight="bold" textAlign="center">
            User Profile
          </Text>

          <Stack mt="20px">
            <Text fontSize="xl">Display Name:</Text>
            <Input
              id="displayName"
              name="displayName"
              type="text"
              onChange={userDetailsFormik.handleChange}
              value={userDetailsFormik.values.displayName}
            />
          </Stack>

          <Stack>
            <Text fontSize="xl">Email:</Text>
            <Input
              id="email"
              name="email"
              type="email"
              onChange={userDetailsFormik.handleChange}
              value={userDetailsFormik.values.email}
            />
          </Stack>

          <Stack>
            <Text fontSize="xl">Language:</Text>
            <Select
              id="lang"
              name="lang"
              type="text"
              placeholder="Select option"
              onChange={userDetailsFormik.handleChange}
              value={userDetailsFormik.values.lang}
            >
              <option value="en">English</option>
              <option value="fr">French</option>
            </Select>
          </Stack>
          <Button type="submit" variantColor="teal" w={'50%'} mt={5}>
            Save Changes
          </Button>
        </Stack>
      </form>

      <Stack Stack p={25} spacing={4}>
        <Text fontSize="2xl" fontWeight="bold" textAlign="center">
          Account Details
        </Text>
        <CheckboxGroup
          mt="20px"
          variantColor="teal"
          defaultValue={['admin', 'active']}
        >
          <Checkbox value="admin">Administrative Account</Checkbox>
          <Checkbox value="active">Account Active</Checkbox>
        </CheckboxGroup>
        <Stack>
          <Text fontSize="xl">API Quota:</Text>
          <NumberInput
            id="apiQuota"
            name="apiQuota"
            defaultValue={15}
            min={10}
            max={20}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </Stack>
        <Stack>
          <Text fontSize="xl">Submission Quota:</Text>
          <NumberInput
            id="submissionQuota"
            name="submissionQuota"
            defaultValue={15}
            min={10}
            max={20}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </Stack>
        <Divider />
        <Stack isInline>
          <Button
            leftIcon="lock"
            variantColor="blue"
            onClick={() => {
              history.push('/two-factor-code')
            }}
          >
            Enable 2FA
          </Button>
          <Button
            leftIcon="edit"
            variantColor="teal"
            onClick={() => {
              window.alert('coming soon')
            }}
          >
            Manage API keys
          </Button>
        </Stack>
        <Button
          variantColor="teal"
          w={'50%'}
          onClick={() => {
            // This clears the JWT, essentially logging the user out in one go
            client.writeData({ data: { jwt: null } }) // How is this done?
            history.push('/')
            toast({
              title: 'Sign Out.',
              description: 'You have successfully been signed out.',
              status: 'success',
              duration: 9000,
              isClosable: true,
            })
          }}
        >
          Sign Out
        </Button>
      </Stack>
      <Stack p={25} spacing={4}>
        <Text fontSize="2xl" fontWeight="bold" textAlign="center">
          Change Password
        </Text>
        <Text>
          Change your password below by entering and confirming a new password.
        </Text>

        <Formik
          initialValues={{password: '', confirmPassword: '' }}
          onSubmit={async values => {
            console.log(values)
            window.alert("Change password submitted.  TODO: Implement GQL call")
          }}
        >
          {({ handleSubmit, isSubmitting }) => (
            <form id="form" onSubmit={handleSubmit}>
              <PasswordConfirmation />

              <Stack mt={6} spacing={4} isInline>
                <Button
                  variantColor="teal"
                  isLoading={isSubmitting}
                  type="submit"
                  id="submitBtn"
                >
                  Change Password
                </Button>
              </Stack>
            </form>
          )}
        </Formik>
      </Stack>
    </SimpleGrid>
  )
}
