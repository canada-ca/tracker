import React from 'react'
import { useLingui } from '@lingui/react'
import { locales, activate } from './i18n.config'
import svgGlobe from './images/vector-globe.svg'
import { Box, PseudoBox, VisuallyHidden, Image } from '@chakra-ui/core'

const Toggler = (props) => {
  const { locale } = props // eslint-disable-line
  return (
    <PseudoBox
      as="button"
      key={locale}
      padding={0}
      onClick={() => activate(locale)}
      _focus={{
        outline: `3px solid yellow.250`,
      }}
      bg="blue.900"
      color="#fff"
    >
      <VisuallyHidden>{locales[locale]}</VisuallyHidden>
      <PseudoBox
        aria-hidden
        fontSize="sm"
        pl={2}
        py={1}
        textTransform="uppercase"
        d={{ base: 'none', md: 'flex' }}
        alignItems="center"
        justifyContent="center"
        _hover={{ color:"yellow.250", border:"1px solid", borderColor:"yellow.250" }}
      >
        {locales[locale]}
        <Image
              src={ svgGlobe }
              px={2}
              alt={('Symbol of the Government of Canada')}
            />
      </PseudoBox>
      <PseudoBox
        aria-hidden
        d={{ base: 'flex', md: 'none' }}
        bg="gray.100"
        textTransform="uppercase"
        size={10}
        alignItems="center"
        justifyContent="center"
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
      {i18n.locale === 'en' && <Toggler locale="fr" />}
      {i18n.locale === 'fr' && <Toggler locale="en" />}
    </Box>
  )
}
