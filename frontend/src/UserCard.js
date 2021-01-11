import React from 'react'
import { Badge, Box, Text, PseudoBox, Stack } from '@chakra-ui/core'
import { Trans } from '@lingui/macro'
import { string, oneOf } from 'prop-types'

export function UserCard({ userName, tfaSendMethod, role }) {
  const validationText =
    tfaSendMethod === 'phone' ? (
      <Trans>Phone 2FA</Trans>
    ) : tfaSendMethod === 'email' ? (
      <Trans>Email 2FA</Trans>
    ) : (
      <Trans>2FA not enabled</Trans>
    )

  return (
    <PseudoBox width="100%" p="8">
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
        <Box>
          <Badge
            variant="solid"
            variantColor={tfaSendMethod !== null ? 'green' : 'red'}
          >
            {validationText}
          </Badge>
        </Box>
      </Stack>
    </PseudoBox>
  )
}

UserCard.propTypes = {
  userName: string.isRequired,
  role: string,
  tfaSendMethod: oneOf(['phone', 'email']),
}
