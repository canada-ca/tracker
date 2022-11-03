import { useMutation } from '@apollo/client'
import { QuestionOutlineIcon } from '@chakra-ui/icons'
import { Badge, Flex, Switch, useToast, Tooltip } from '@chakra-ui/react'
import { Trans, t } from '@lingui/macro'
import { bool } from 'prop-types'
import React from 'react'
import { UPDATE_USER_PROFILE } from '../graphql/mutations'
import { useUserVar } from '../utilities/userState'

export function InsideUserSwitch({ insideUser }) {
  const toast = useToast()
  const { login, currentUser } = useUserVar()

  const [updateUserProfile, { error: _updateUserProfileError }] = useMutation(
    UPDATE_USER_PROFILE,
    {
      onError: ({ message }) => {
        toast({
          title: t`An error occurred while updating your insider preference.`,
          description: message,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      },
      onCompleted({ updateUserProfile }) {
        console.log(updateUserProfile)
        if (updateUserProfile.result.__typename === 'UpdateUserProfileResult') {
          toast({
            title: t`Insider status changed`,
            description: t`You have successfully updated your insider preference.`,
            status: 'success',
            duration: 9000,
            isClosable: true,
            position: 'top-left',
          })
          login({
            ...currentUser,
            insideUser: updateUserProfile.result.user.insideUser,
          })
        } else if (
          updateUserProfile.result.__typename === 'UpdateUserProfileError'
        ) {
          toast({
            title: t`Unable to update to your insider status, please try again.`,
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
    },
  )
  return (
    <Flex p="1" align="center">
      <Tooltip
        label={t`For users interested in using new features that are still in progress.`}
      >
        <QuestionOutlineIcon tabIndex={0} />
      </Tooltip>
      <Switch
        isFocusable={true}
        id="Inside User"
        name="Inside User"
        aria-label="Inside User"
        mx="2"
        defaultChecked={insideUser}
        onChange={async (e) =>
          await updateUserProfile({
            variables: { insideUser: e.target.checked },
          })
        }
      />
      <Badge variant="outline" color="gray.900" p="1.5">
        <Trans>Feature Preview</Trans>
      </Badge>
    </Flex>
  )
}

InsideUserSwitch.propTypes = {
  insideUser: bool.isRequired,
}
