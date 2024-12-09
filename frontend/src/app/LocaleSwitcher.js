import React from 'react'
import { useLingui } from '@lingui/react'
import { Box, Text, VisuallyHidden } from '@chakra-ui/react'
import { useApolloClient } from '@apollo/client'

import { activate, locales } from '../utilities/i18n.config'

const Toggler = (props) => {
  const { locale } = props // eslint-disable-line

  const client = useApolloClient()

  return (
    <Box
      as="button"
      key={locale}
      padding={0}
      onClick={() => {
        activate(locale).then(() => client.resetStore())
      }}
      _focus={{
        outline: `3px solid accent`,
      }}
      _hover={{
        bg: 'gray.200',
      }}
    >
      <VisuallyHidden>{locales[locale]}</VisuallyHidden>
      <Box
        borderWidth="1px"
        borderColor="gray.300"
        aria-hidden
        display="flex"
        color="primary"
        textTransform="uppercase"
        fontWeight="bold"
        fontSize="lg"
        alignItems="center"
        justifyContent="center"
        borderRadius="0.25rem"
      >
        <Text py="1" px="4">
          {locale}
        </Text>
      </Box>
    </Box>
  )
}

export function LocaleSwitcher({ ...props }) {
  const { i18n } = useLingui()
  return (
    <Box {...props}>
      {i18n.locale === 'en' && <Toggler locale="fr" />}
      {i18n.locale === 'fr' && <Toggler locale="en" />}
    </Box>
  )
}
