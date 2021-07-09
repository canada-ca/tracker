import React from 'react'
import { useLingui } from '@lingui/react'
import { activate, locales } from './i18n.config'
import { Box, PseudoBox, VisuallyHidden } from '@chakra-ui/core'
import { useApolloClient } from '@apollo/client'

const Toggler = (props) => {
  const { locale } = props // eslint-disable-line

  const client = useApolloClient()

  return (
    <PseudoBox
      as="button"
      key={locale}
      padding={0}
      onClick={() => {
        activate(locale).then(() => client.resetStore())
      }}
      _focus={{
        outline: `3px solid accent`,
      }}
      bg="primary"
      color="#fff"
    >
      <VisuallyHidden>{locales[locale]}</VisuallyHidden>
      <PseudoBox
        aria-hidden
        d="flex"
        bg="gray.100"
        color="primary"
        textTransform="uppercase"
        fontWeight="bold"
        fontSize="lg"
        boxSize={10}
        alignItems="center"
        justifyContent="center"
        borderRadius="0.25rem"
      >
        {locale}
      </PseudoBox>
    </PseudoBox>
  )
}

export function LocaleSwitcher() {
  const { i18n } = useLingui()
  return (
    <Box>
      {i18n.locale === 'en' && <Toggler locale='fr' />}
      {i18n.locale === 'fr' && <Toggler locale='en' />}
    </Box>
  )
}
