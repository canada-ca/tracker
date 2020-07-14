import React from 'react'
import { Formik } from 'formik'
import { useHistory, useLocation } from 'react-router-dom'
import { string } from 'prop-types'
import {
  Stack,
  SimpleGrid,
  Button,
  Text,
  Input,
  Divider,
  Checkbox,
  CheckboxGroup,
  useToast,
} from '@chakra-ui/core'
import { useMutation, useQuery } from '@apollo/react-hooks'
import PasswordConfirmation from './PasswordConfirmation'
import LanguageSelect from './LanguageSelect'

import { useUserState } from './UserState'
import { QUERY_USER } from './graphql/queries'
import { UPDATE_PASSWORD } from './graphql/mutations'
import EmailField from './EmailField'
import DisplayNameField from './DisplayNameField'

export default function UserPage() {
  const location = useLocation()
  const toast = useToast()
  const history = useHistory()
  const { currentUser, logout } = useUserState()

  const [
    updatePassword,
    {
      loading: updatePasswordLoading,
      error: updatePasswordError,
      data: updatePasswordData,
    },
  ] = useMutation(UPDATE_PASSWORD, {
    context: {
      headers: {
        authorization: currentUser.jwt,
      },
    },
  })

  const {
    loading: queryUserLoading,
    error: queryUserError,
    data: queryUserData,
  } = useQuery(QUERY_USER, {
    context: {
      headers: {
        authorization: currentUser.jwt,
      },
    },
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
        {({ handleSubmit, _handleChange, _values }) => (
          <form onSubmit={handleSubmit}>
            <Stack p={25} spacing={4}>
              <Text fontSize="2xl" fontWeight="bold" textAlign="center">
                User Profile
              </Text>

              <DisplayNameField name="displayName" />

              <EmailField name="email" />

                <LanguageSelect name="lang" />

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
            logout()
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
