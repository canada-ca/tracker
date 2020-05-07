import React from 'react'
import { Formik } from 'formik'
import { useHistory , useLocation } from 'react-router-dom'
import { string } from 'prop-types'
import {
  Stack,
  SimpleGrid,
  Button,
  Text,
  Select,
  Input,
  Divider,
  Checkbox,
  CheckboxGroup,
  useToast,
} from '@chakra-ui/core'
import { useApolloClient, useMutation, useQuery } from '@apollo/react-hooks'
import { PasswordConfirmation } from './PasswordConfirmation'

import { useUserState } from './UserState'
import { QUERY_USER } from './graphql/queries'
import { UPDATE_PASSWORD } from './graphql/mutations'

export default function UserPage() {
  const location = useLocation()
  const client = useApolloClient()
  const toast = useToast()
  const history = useHistory()
  const { currentUser } = useUserState()

  const [
    updatePassword,
    {
      loading: updatePasswordLoading,
      error: updatePasswordError,
      data: updatePasswordData,
    },
  ] = useMutation(UPDATE_PASSWORD)

  const {
    loading: queryUserLoading,
    error: queryUserError,
    data: queryUserData,
  } = useQuery(QUERY_USER, {
    variables: {
      userName: currentUser.userName,
    },
  })

  if (queryUserLoading) {
    return <p>Loading user...</p>
  }

  if (queryUserError) {
    return <p>{String(queryUserError)}</p>
  }

  if (updatePasswordLoading) {
    return <p>Loading...</p>
  }

  if (updatePasswordError) {
    return <p>{String(updatePasswordError)}</p>
  }

  return (
    <SimpleGrid columns={{ md: 1, lg: 2 }} spacing="60px" width="100%">
      <Formik
        initialValues={{
          email: currentUser.userName,
          lang: queryUserData.userPage.lang,
          displayName: queryUserData.userPage.displayName,
        }}
        onSubmit={(values, actions) => {
          window.alert('coming soon!!\n' + JSON.stringify(values, null, 2))
          actions.setSubmitting(false)
        }}
      >
        {({handleSubmit, handleChange, values}) => (
          <form onSubmit={handleSubmit}>
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
                  onChange={handleChange}
                  value={values.displayName}
                />
              </Stack>

              <Stack>
                <Text fontSize="xl">Email:</Text>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  onChange={handleChange}
                  value={values.email}
                />
              </Stack>

              <Stack>
                <Text fontSize="xl">Language:</Text>
                <Select
                  id="lang"
                  name="lang"
                  type="text"
                  placeholder="Select option"
                  onChange={handleChange}
                  value={values.lang}
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
        )}
      </Formik>

      <Stack Stack p={25} spacing={4}>
        <Text fontSize="2xl" fontWeight="bold" textAlign="center">
          Account Details
        </Text>
        <CheckboxGroup
          mt="20px"
          variantColor="teal"
          defaultValue={[
            queryUserData.userPage.userAffiliations[0].admin ? 'admin' : '',
            'active',
          ]}
        >
          <Checkbox value="admin">Administrative Account</Checkbox>
          <Checkbox value="active">Account Active</Checkbox>
        </CheckboxGroup>
        <Divider />
        <Stack isInline>
          <Button
            leftIcon="lock"
            variantColor="blue"
            onClick={() => {
              history.push('/two-factor-code')
            }}
            isDisabled={!!location.state}
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
            client.writeData({ data: { jwt: null, tfa: null, userName: null } }) // How is this done?
            history.push('/')
            toast({
              title: 'Sign Out.',
              description: 'You have successfully been signed out.',
              status: 'success',
              duration: 9000,
              isClosable: true,
            })
          }}
          isDisabled={!!location.state}
        >
          Sign Out
        </Button>
      </Stack>
      <Stack p={25} spacing={4}>
        <Text fontSize="2xl" fontWeight="bold" textAlign="center">
          Change Password
        </Text>

        {location.state ? (
          <Text>You can only change the password for your own account.</Text>
        ) : (
          <Formik
            initialValues={{ password: '', confirmPassword: '' }}
            onSubmit={async (values) => {
              // Submit GraphQL mutation
              console.log(values)
              await updatePassword({
                variables: {
                  userName: currentUser.userName,
                  password: values.password,
                  confirmPassword: values.confirmPassword,
                },
              })

              if (!updatePasswordError) {
                console.log(updatePasswordData)
                toast({
                  title: 'Password Updated.',
                  description: 'You have successfully changed your password.',
                  status: 'success',
                  duration: 9000,
                  isClosable: true,
                })
              }
            }}
          >
            {({ handleSubmit, isSubmitting }) => (
              <form id="form" onSubmit={handleSubmit}>
                <Text>
                  Change your password below by entering and confirming a new
                  password.
                </Text>
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
        )}
      </Stack>
    </SimpleGrid>
  )
}

UserPage.propTypes = { userName: string }
