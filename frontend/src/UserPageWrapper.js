import React from 'react'
import { string } from 'prop-types'
import { useQuery } from '@apollo/client'
import { QUERY_CURRENT_USER } from './graphql/queries'
import { Trans } from '@lingui/macro'
import { LoadingMessage } from './LoadingMessage'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'
import UserPage from './UserPage'

export default function UserPageWrapper() {

  const {
    loading: queryUserLoading,
    error: queryUserError,
    data: queryUserData,
  } = useQuery(QUERY_CURRENT_USER, {})

  if (queryUserLoading) {
    return (
      <LoadingMessage>
        <Trans>Account Settings</Trans>
      </LoadingMessage>
    )
  }

  if (queryUserError) {
    return <ErrorFallbackMessage error={queryUserError} />
  }

  const {
    displayName,
    userName,
    preferredLang,
    phoneNumber,
    tfaSendMethod,
    emailValidated,
    phoneValidated,
  } = queryUserData?.userPage

  return (
    <UserPage
      displayName={displayName}
      userName={userName}
      preferredLang={preferredLang}
      phoneNumber={phoneNumber}
      tfaSendMethod={tfaSendMethod}
      emailValidated={emailValidated}
      phoneValidated={phoneValidated}
    />
  )
}

UserPage.propTypes = { userName: string }
