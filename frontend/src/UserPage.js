import React from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { string } from 'prop-types'
import {
  Stack,
  SimpleGrid,
  Button,
  Divider,
  Checkbox,
  CheckboxGroup,
  useToast,
  Heading,
} from '@chakra-ui/core'
import { useQuery } from '@apollo/client'
import { useUserState } from './UserState'
import { QUERY_USER } from './graphql/queries'
import { Trans } from '@lingui/macro'
import EditableUserLanguage from './EditableUserLanguage'
import EditableUserDisplayName from './EditableUserDisplayName'
import EditableUserEmail from './EditableUserEmail'
import EditableUserPassword from './EditableUserPassword'

export default function UserPage() {
  const location = useLocation()
  const toast = useToast()
  const history = useHistory()
  const { currentUser, logout } = useUserState()

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
        <EditableUserDisplayName
          detailValue={queryUserData.userPage.displayName}
        />

        <Divider />

        <EditableUserEmail detailValue={currentUser.userName} />

        <Divider />

        <EditableUserPassword />

        <Divider />

        <EditableUserLanguage currentLang={queryUserData.userPage.lang} />
      </Stack>

      <Stack Stack p={25} spacing={4}>
        <Heading as="h1" size="lg" textAlign="center">
          <Trans>Account Details</Trans>
        </Heading>
        <CheckboxGroup
          mt="20px"
          _checked={{ bg: 'cyan.800', color: 'white', borderColor: 'cyan.800' }}
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
            color="gray.50"
            bg="blue.700"
            onClick={() => {
              history.push('/two-factor-code')
            }}
            isDisabled={!!location.state}
          >
            <Trans>Enable 2FA</Trans>
          </Button>
          <Button
            leftIcon="edit"
            color="gray.50"
            bg="blue.700"
            onClick={() => {
              window.alert('coming soon')
            }}
          >
            <Trans>Manage API keys</Trans>
          </Button>
        </Stack>

        <Button
          color="gray.50"
          bg="blue.700"
          w="50%"
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
