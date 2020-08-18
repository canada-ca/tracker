import React from 'react'
import { Badge, Box, Text, PseudoBox, Stack } from '@chakra-ui/core'
import { Trans } from '@lingui/macro'
import { useHistory } from 'react-router-dom'
import { bool, string } from 'prop-types'

export function UserCard({ userName, displayName, tfa, role }) {
  const history = useHistory()
  return (
    <PseudoBox
      width="100%"
      display={{ md: 'flex' }}
      alignItems="center"
      onClick={() => {
        history.push({
          pathname: '/user',
          state: { detail: userName },
        })
      }}
      _hover={{ borderColor: 'gray.200', bg: 'gray.200' }}
      p="8"
    >
      <Box flexShrink="0" minW="15%">
        <Text mt="1" fontSize="md" fontWeight="semibold">
          {displayName}
        </Text>
      </Box>
      <Box flexShrink="0" ml={{ md: 2 }} mr={{ md: 2 }}>
        <Text fontSize="md" minW="10%">
          {userName}
        </Text>
      </Box>
      {role && (
        <Box flexShrink="0" ml={{ md: 2 }} mr={{ md: 2 }}>
          <Stack isInline align="center">
            <Badge
              color="primary"
              bg="transparent"
              borderColor="primary"
              borderWidth="1px"
            >
              {role}
            </Badge>
            {tfa !== null && (
              <Badge variantColor={tfa ? 'green' : 'red'}>
                <Trans>2FA</Trans>
              </Badge>
            )}
          </Stack>
        </Box>
      )}
    </PseudoBox>
  )
}

UserCard.propTypes = {
  displayName: string.isRequired,
  userName: string.isRequired,
  role: string,
  tfa: bool,
}
