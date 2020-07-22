import React from 'react'
import { Formik } from 'formik'
import { useHistory, useLocation } from 'react-router-dom'
import { string } from 'prop-types'
import {
  Stack,
  SimpleGrid,
  Button,
  Text,
  Divider,
  Checkbox,
  CheckboxGroup,
  useToast,
  useDisclosure,
  Heading,
} from '@chakra-ui/core'
import { useMutation, useQuery } from '@apollo/react-hooks'
import PasswordConfirmation from './PasswordConfirmation'
import LanguageSelect from './LanguageSelect'
import { useUserState } from './UserState'
import { QUERY_USER } from './graphql/queries'
import EmailField from './EmailField'
import DisplayNameField from './DisplayNameField'
import { UPDATE_USER_PROFILE } from './graphql/mutations'
import { Trans, t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import ConfirmPasswordModal from './ConfirmPasswordModal'

export default function UserPage() {
  const location = useLocation()
  const toast = useToast()
  const history = useHistory()
  const { currentUser, logout } = useUserState()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { i18n } = useLingui()
  const changePasswordBtnRef = React.useRef()
  const currentPasswordRef = React.useRef()

  const [updatePassword, { error: updatePasswordError }] = useMutation(
    UPDATE_USER_PROFILE,
    {
      context: {
        headers: {
          authorization: currentUser.jwt,
        },
      },
      onError() {
        console.log(updatePasswordError)
        toast({
          title: i18n._(t`An error occurred.`),
          description: i18n._(
            t`Unable to update your password, please try again.`,
          ),
          status: 'error',
          duration: 9000,
          isClosable: true,
        })
      },
    },
  )

  const [updateUserProfile, { error: updateUserProfileError }] = useMutation(
    UPDATE_USER_PROFILE,
    {
      context: {
        headers: {
          authorization: currentUser.jwt,
        },
      },
      onError() {
        console.log(updateUserProfileError)
        toast({
          title: i18n._(t`An error occurred.`),
          description: i18n._(
            t`Unable to update your profile, please try again.`,
          ),
          status: 'error',
          duration: 9000,
          isClosable: true,
        })
      },
    },
  )

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

  return (
    <SimpleGrid columns={{ md: 1, lg: 2 }} spacing="60px" width="100%">
      <Formik
        initialValues={{
          displayName: queryUserData.userPage.displayName,
          email: currentUser.userName,
          lang: queryUserData.userPage.lang,
        }}
        onSubmit={(values, actions) => {
          window.alert('coming soon!!\n' + JSON.stringify(values, null, 2))
          actions.setSubmitting(false)
        }}
      >
        {({ handleSubmit, isSubmitting }) => (
          <form onSubmit={handleSubmit}>
            <Stack p={25} spacing={4}>
              <Heading as="h1" size="lg" textAlign="center">
                <Trans>User Profile</Trans>
              </Heading>

              <DisplayNameField name="displayName" />

              <EmailField name="email" />

              <LanguageSelect name="lang" />

              <Button
                type="submit"
                variantColor="teal"
                width="fit-content"
                px={8}
                isLoading={isSubmitting}
              >
                <Trans>Save Changes</Trans>
              </Button>
            </Stack>
          </form>
        )}
      </Formik>

      <Stack Stack p={25} spacing={4}>
        <Heading as="h1" size="lg" textAlign="center">
          <Trans>Account Details</Trans>
        </Heading>
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
            <Trans>Enable 2FA</Trans>
          </Button>
          <Button
            leftIcon="edit"
            variantColor="teal"
            onClick={() => {
              window.alert('coming soon')
            }}
          >
            <Trans>Manage API keys</Trans>
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
          <Trans>Sign Out</Trans>
        </Button>
      </Stack>

      <Formik
        initialValues={{
          password: '',
          confirmPassword: '',
          currentPassword: '',
        }}
        onSubmit={async values => {
          // Submit update password mutation
          await updatePassword({
            variables: {
              userName: currentUser.userName,
              password: values.password,
              confirmPassword: values.confirmPassword,
              currentPassword: values.currentPassword,
            },
          })
        }}
      >
        {({ handleSubmit, isSubmitting, values }) => (
          <form id="form" onSubmit={handleSubmit}>
            <Stack spacing={4} p={25}>
              <Heading as="h1" size="lg" textAlign="center">
                <Trans>Change Password</Trans>
              </Heading>

              <Text>
                <Trans>
                  Change your password below by entering and confirming a new
                  password.
                </Trans>
              </Text>

              <PasswordConfirmation />

              <Button
                onClick={onOpen}
                variantColor="teal"
                width="fit-content"
                px={8}
                ref={changePasswordBtnRef}
              >
                <Trans>Change Password</Trans>
              </Button>

              <ConfirmPasswordModal
                isOpen={isOpen}
                onClose={onClose}
                initialFocusRef={currentPasswordRef}
                finalFocusRef={changePasswordBtnRef}
                isSubmitting={isSubmitting}
                values={values}
              />
            </Stack>
          </form>
        )}
      </Formik>
    </SimpleGrid>
  )
}

UserPage.propTypes = { userName: string }
