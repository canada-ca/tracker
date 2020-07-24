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
  ModalFooter,
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
  InputRightElement,
} from '@chakra-ui/core'
import { useMutation, useQuery } from '@apollo/client'
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
import PasswordField from './PasswordField'
import EditableUserDetail from './EditableUserDetail'
import EditableUserLanguage from './EditableUserLanguage'
import EditDisplayNameModal from './EditDisplayNameModal'
import { object } from 'yup'
import { fieldRequirements } from './fieldRequirements'

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
          title="Edit Display Name"
          detailName="Display Name:"
          detailHeading="Current Display Name:"
          detailValue={queryUserData.userPage.displayName}
          iconName="person"
          iconSize="1.5rem"
          body={
            <DisplayNameField name="displayName" label="New Display Name:" />
          }
          toastDescriptionCompleted="You have successfully updated your display name."
          validationSchema={object().shape({
            displayName: fieldRequirements.displayName,
          })}
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

        {/*<EditableUserDetail detailName="Email:" iconName="email" detailValue="Test email"/>*/}

        {/*<EditableUserDetail detailName="Password:" iconName="lock" detailValue="********"/>*/}

        {/* <EditableUserLanguage detailName="Language:" />*/}
      </Stack>
      {/*<Formik*/}
      {/*  initialValues={{*/}
      {/*    displayName: queryUserData.userPage.displayName,*/}
      {/*    email: currentUser.userName,*/}
      {/*    lang: queryUserData.userPage.lang,*/}
      {/*  }}*/}
      {/*  onSubmit={(values, actions) => {*/}
      {/*    window.alert('coming soon!!\n' + JSON.stringify(values, null, 2))*/}
      {/*    actions.setSubmitting(false)*/}
      {/*  }}*/}
      {/*>*/}
      {/*  {({ handleSubmit, isSubmitting }) => (*/}
      {/*    <form onSubmit={handleSubmit}>*/}
      {/*      <Stack p={25} spacing={4}>*/}
      {/*        <Heading as="h1" size="lg" textAlign="center">*/}
      {/*          <Trans>User Profile</Trans>*/}
      {/*        </Heading>*/}

      {/*        <DisplayNameField*/}
      {/*          name="displayName"*/}
      {/*          value={queryUserData.userPage.displayName}*/}
      {/*          isReadOnly={true}*/}
      {/*          rightInputElement={*/}
      {/*            <InputRightElement width="fit-content">*/}
      {/*              <Button*/}
      {/*                id="editButton"*/}
      {/*                h="1.75rem"*/}
      {/*                size="sm"*/}
      {/*                px="2rem"*/}
      {/*                mr="1rem"*/}
      {/*              >*/}
      {/*                Edit*/}
      {/*              </Button>*/}
      {/*            </InputRightElement>*/}
      {/*          }*/}
      {/*        />*/}

      {/*        <EmailField*/}
      {/*          name="email"*/}
      {/*          value={currentUser.userName}*/}
      {/*          isReadOnly={true}*/}
      {/*          rightInputElement={*/}
      {/*            <InputRightElement width="fit-content">*/}
      {/*              <Button*/}
      {/*                id="editButton"*/}
      {/*                h="1.75rem"*/}
      {/*                size="sm"*/}
      {/*                px="2rem"*/}
      {/*                mr="1rem"*/}
      {/*              >*/}
      {/*                Edit*/}
      {/*              </Button>*/}
      {/*            </InputRightElement>*/}
      {/*          }*/}
      {/*        />*/}

      {/*        <PasswordField*/}
      {/*          name="password"*/}
      {/*          isReadOnly={true}*/}
      {/*          type="password"*/}
      {/*          value="examplepass"*/}
      {/*          rightInputElement={*/}
      {/*            <InputRightElement width="fit-content">*/}
      {/*              <Button*/}
      {/*                id="editButton"*/}
      {/*                h="1.75rem"*/}
      {/*                size="sm"*/}
      {/*                px="2rem"*/}
      {/*                mr="1rem"*/}
      {/*              >*/}
      {/*                Edit*/}
      {/*              </Button>*/}
      {/*            </InputRightElement>*/}
      {/*          }*/}
      {/*        />*/}

      {/*<LanguageSelect name="lang" />*/}

      {/*<Button*/}
      {/*  type="submit"*/}
      {/*  variantColor="teal"*/}
      {/*  width="fit-content"*/}
      {/*  px={8}*/}
      {/*  isLoading={isSubmitting}*/}
      {/*>*/}
      {/*  <Trans>Save Changes</Trans>*/}
      {/*</Button>*/}
      {/*</Stack>*/}
      {/*    </form>*/}
      {/*  )}*/}
      {/*</Formik>*/}

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
              <Button
                variantColor="teal"
                isLoading={isSubmitting}
                type="submit"
                id="submitBtn"
                mr={4}
              >
                <Trans>Confirm</Trans>
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
