import React from 'react'
import { useLingui } from '@lingui/react'
import { locales, activate } from './i18n.config'
import svgGlobe from './images/vector-globe.svg'
import { Box, PseudoBox, VisuallyHidden, Image } from '@chakra-ui/core'
import { ApolloConsumer } from '@apollo/client'

const Toggler = props => {
  const { locale } = props // eslint-disable-line
  return (
    <ApolloConsumer>
      {client => (
        <PseudoBox
          as='button'
          key={locale}
          padding={0}
          onClick={() => {
            activate(locale).then(() => client.resetStore())
          }}
          _focus={{
            outline: `3px solid accent`,
          }}
          bg='primary'
          color='#fff'
        >
          <VisuallyHidden>{locales[locale]}</VisuallyHidden>
          <PseudoBox
            aria-hidden
            fontSize='sm'
            pl={2}
            py={1}
            textTransform='uppercase'
            d={{ base: 'none', md: 'flex' }}
            alignItems='center'
            justifyContent='center'
            _hover={{
              color: 'accent',
              border: '1px solid',
              borderColor: 'accent',
            }}
          >
            {locales[locale]}
            <Image src={svgGlobe} px={2} alt={'SVG Globe'} />
          </PseudoBox>
          <PseudoBox
            aria-hidden
            d={{ base: 'flex', md: 'none' }}
            bg='gray.100'
            color='primary'
            textTransform='uppercase'
            fontWeight='bold'
            fontSize='lg'
            size={10}
            alignItems='center'
            justifyContent='center'
          >
            {locale}
          </PseudoBox>
        </PseudoBox>)}

    </ApolloConsumer>
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
