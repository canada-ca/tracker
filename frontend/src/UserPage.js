import React from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { string } from 'prop-types'
import {
  Stack,
  SimpleGrid,
  Divider,
  Checkbox,
  CheckboxGroup,
  Heading,
  Icon,
} from '@chakra-ui/core'
import { useQuery } from '@apollo/client'
import { useUserState } from './UserState'
import { QUERY_USER } from './graphql/queries'
import { Trans } from '@lingui/macro'
import EditableUserLanguage from './EditableUserLanguage'
import EditableUserDisplayName from './EditableUserDisplayName'
import EditableUserEmail from './EditableUserEmail'
import EditableUserPassword from './EditableUserPassword'
import { TrackerButton } from './TrackerButton'

export default function UserPage() {
  const location = useLocation()
  const history = useHistory()
  const { currentUser } = useUserState()

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
        <Heading as="h1" size="lg" textAlign="left">
          <Trans>Account Details</Trans>
        </Heading>
        <CheckboxGroup
          mt="20px"
          defaultValue={[
            queryUserData.userPage.userAffiliations[0].admin ? 'admin' : '',
            'active',
          ]}
        >
          <Checkbox value="admin">
            <Trans>Administrative Account</Trans>
          </Checkbox>
          <Checkbox value="active">
            <Trans>Account Active</Trans>
          </Checkbox>
        </CheckboxGroup>
        <Divider />
        <Stack
          isInline={[false, true]}
          justifyContent={['space-between', 'flex-start']}
        >
          <TrackerButton
            variant="primary"
            onClick={() => {
              history.push('/two-factor-code')
            }}
            isDisabled={!!location.state}
          >
            <Icon name="lock" />
            <Trans>Enable 2FA</Trans>
          </TrackerButton>

          <TrackerButton
            variant="primary"
            onClick={() => {
              window.alert('coming soon')
            }}
          >
            <Icon name="edit" />
            <Trans>Manage API keys</Trans>
          </TrackerButton>
        </Stack>
      </Stack>
    </SimpleGrid>
  )
}

UserPage.propTypes = { userName: string }
