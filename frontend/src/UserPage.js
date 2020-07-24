import React from 'react'
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
import { useMutation, useQuery } from '@apollo/client'
import PasswordConfirmation from './PasswordConfirmation'
import { useUserState } from './UserState'
import { QUERY_USER } from './graphql/queries'
import EmailField from './EmailField'
import DisplayNameField from './DisplayNameField'
import { UPDATE_USER_PROFILE } from './graphql/mutations'
import { Trans, t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import PasswordField from './PasswordField'
import EditableUserDetail from './EditableUserDetail'
import EditableUserLanguage from './EditableUserLanguage'
import { object } from 'yup'
import { fieldRequirements } from './fieldRequirements'

export default function UserPage() {
  const location = useLocation()
  const toast = useToast()
  const history = useHistory()
  const { currentUser, logout } = useUserState()
  const { i18n } = useLingui()
  const changePasswordBtnRef = React.useRef()
  const currentPasswordRef = React.useRef()

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
      <Stack p={25} spacing={4}>
        <EditableUserDetail
          detailValue={queryUserData.userPage.displayName}
        />

        <Divider />

        <EditableUserDetail
          title="Edit Email"
          detailName="Email:"
          detailHeading="Current Email:"
          detailValue={currentUser.userName}
          iconName="email"
          body={<EmailField name="email" label="New Email Address:" />}
          toastDescriptionCompleted="You have successfully updated your email."
          validationSchema={object().shape({ email: fieldRequirements.email })}
        />

        <Divider />

        <EditableUserDetail
          title="Change Password"
          detailName="Password:"
          detailValue="************"
          iconName="lock"
          body={
            <Stack spacing={4} align="center">
              <PasswordField
                name="currentPassword"
                label="Current Password:"
                width="100%"
              />
              <Text textAlign="center">
                Enter and confirm your new password below:
              </Text>
              <PasswordConfirmation
                width="100%"
                passwordLabel="New Password:"
                confirmPasswordLabel="Confirm New Password:"
              />
            </Stack>
          }
          toastDescriptionCompleted="You have successfully updated your password."
          validationSchema={object().shape({
            currentPassword: fieldRequirements.password,
            password: fieldRequirements.password,
            confirmPassword: fieldRequirements.confirmPassword,
          })}
        />

        <Divider />

        <EditableUserLanguage currentLang={queryUserData.userPage.lang} />
      </Stack>

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
    </SimpleGrid>
  )
}

UserPage.propTypes = { userName: string }
