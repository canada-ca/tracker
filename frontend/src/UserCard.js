import React from 'react'
import { Badge, Box, Text, PseudoBox, Stack } from '@chakra-ui/core'
import { Trans } from '@lingui/macro'
import { useHistory } from 'react-router-dom'
import { bool, string } from 'prop-types'

export function UserCard({ userName, tfa, role }) {
  const history = useHistory()
  return (
    <PseudoBox
      width="100%"
      onClick={() => {
        history.push({
          pathname: '/user',
          state: { detail: userName },
        })
      }}
      _hover={{ borderColor: 'gray.200', bg: 'gray.200' }}
      p="8"
      as="button"
    >
      <Stack isInline align="center" mb={['1', '0']}>
        <Box>
          <Text fontSize="md">{userName}</Text>
        </Box>
        <Box ml="auto" /> {/* spacer */}
        {role && (
          <Box>
            <Badge
              color="primary"
              bg="transparent"
              borderColor="primary"
              borderWidth="1px"
            >
              {role}
            </Badge>
          </Box>
        )}
        {tfa !== null && (
          <Box>
            <Badge variantColor={tfa ? 'green' : 'red'}>
              <Trans>2FA Validated</Trans>
            </Badge>
          </Box>
        )}
      </Stack>
    </PseudoBox>
  )
}

UserCard.propTypes = {
  userName: string.isRequired,
  role: string,
  tfa: bool,
}
