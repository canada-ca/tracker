import React from 'react'
import PropTypes from 'prop-types'
import { Box, Text } from '@chakra-ui/react'
import { t, Trans } from '@lingui/macro'

export function StrengthCategory({ items, strength, type }) {
  let titleBg = 'info'
  let mainBg = 'info'
  let title = ''

  switch (strength) {
    case 'strong':
      titleBg = 'strongMuted'
      mainBg = 'strong'
      break
    case 'acceptable':
      titleBg = 'moderateMuted'
      mainBg = 'moderate'
      break
    case 'weak':
      titleBg = 'weakMuted'
      mainBg = 'weak'
      break
  }

  switch (type) {
    case 'ciphers':
      title = t`Strong Ciphers:`
      break
    case 'curves':
      title = t`Strong Curves:`
      break
  }

  const mapCiphers = (cipherList) => {
    return (
      <Box px="2">
        {cipherList.length > 0 ? (
          cipherList.map((cipher, id) => {
            return (
              <Text key={id} isTruncated fontSize={{ base: 'sm', md: 'md' }}>
                {cipher}
              </Text>
            )
          })
        ) : (
          <Text>
            <Trans>None</Trans>
          </Text>
        )}
      </Box>
    )
  }

  return (
    <Box bg={titleBg}>
      <Box bg={mainBg} color="white" px="2">
        <Text fontWeight="bold" variant="shadow">
          {title}
        </Text>
      </Box>
      {mapCiphers(items)}
    </Box>
  )
}

StrengthCategory.propTypes = {
  items: PropTypes.arrayOf(PropTypes.string).isRequired,
  strength: PropTypes.oneOf(['strong', 'acceptable', 'weak']).isRequired,
  type: PropTypes.oneOf(['curves', 'ciphers']).isRequired,
}
