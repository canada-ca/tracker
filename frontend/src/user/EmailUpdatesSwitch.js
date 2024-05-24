import { useMutation } from '@apollo/client'
import { QuestionOutlineIcon } from '@chakra-ui/icons'
import { Badge, Flex, Switch, useToast, Tooltip } from '@chakra-ui/react'
import { Trans, t } from '@lingui/macro'
import { bool } from 'prop-types'
import React from 'react'
import { UPDATE_USER_PROFILE } from '../graphql/mutations'
import { useUserVar } from '../utilities/userState'

export function EmailUpdatesSwitch({ receiveUpdateEmails }) {
  const toast = useToast()
  const { login, currentUser } = useUserVar()

  const [updateUserProfile, { error: _updateUserProfileError }] = useMutation(UPDATE_USER_PROFILE, {
    onError: ({ message }) => {
      toast({
        title: t`An error occurred while updating your email update preference.`,
        description: message,
        status: 'error',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    },
    onCompleted({ updateUserProfile }) {
      if (updateUserProfile.result.__typename === 'UpdateUserProfileResult') {
        toast({
          title: t`Email Updates status changed`,
          description: t`You have successfully updated your email update preference.`,
          status: 'success',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
        login({
          ...currentUser,
          receiveUpdateEmails: updateUserProfile.result.user.receiveUpdateEmails,
        })
      } else if (updateUserProfile.result.__typename === 'UpdateUserProfileError') {
        toast({
          title: t`Unable to update to your Email Updates status, please try again.`,
          description: updateUserProfile.result.description,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      } else {
        toast({
          title: t`Incorrect update method received.`,
          description: t`Incorrect updateUserProfile.result typename.`,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
        console.log('Incorrect updateUserProfile.result typename.')
      }
    },
  })
  return (
    <Flex p="1" align="center">
      <Tooltip
        label={t`For organization admins interested in receiving email updates on new activity in their organizations.`}
      >
        <QuestionOutlineIcon tabIndex={0} />
      </Tooltip>
      <Switch
        isFocusable={true}
        id="Email Updates"
        name="Email Updates"
        aria-label="Email Updates"
        mx="2"
        defaultChecked={receiveUpdateEmails}
        onChange={async (e) =>
          await updateUserProfile({
            variables: { receiveUpdateEmails: e.target.checked },
          })
        }
      />
      <Badge variant="outline" color="gray.900" p="1.5">
        <Trans>Email Updates</Trans>
      </Badge>
    </Flex>
  )
}

EmailUpdatesSwitch.propTypes = {
  receiveUpdateEmails: bool.isRequired,
}
