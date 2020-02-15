import React from 'react'
import { useLingui } from '@lingui/react'
import { Global, css } from '@emotion/core'
import { Home } from './Home'
import { Trans } from '@lingui/macro'
import { TopBanner } from './components/topbanner'
import { PhaseBanner } from './components/phase-banner'
import { Footer } from './components/footer'
import { ThemeProvider, Flex, Link, CSSReset } from '@chakra-ui/core'
import canada from './theme/canada'
import { SkipLink } from './components/skip-link'

export default function App() {
  const { i18n } = useLingui()

  return (
    <ThemeProvider theme={canada}>
      <CSSReset />
      <Global
        styles={css`
          @import url('https://fonts.googleapis.com/css?family=Noto+Sans:400,400i,700,700i&display=swap');
        `}
      />
      <Flex direction="column" minHeight="100vh" bg="gray.50">
        <header>
          <SkipLink invisible href="#main">
            <Trans>Skip to main content</Trans>
          </SkipLink>
          <PhaseBanner phase={<Trans>Pre-Alpha</Trans>}>
            <Trans>This service is being developed in the open</Trans>
          </PhaseBanner>
          <TopBanner lang={i18n.locale} />
        </header>

        <Flex
          as="main"
          id="main"
          fontFamily="body"
          flex="1 0 auto"
          mx="auto"
          pt={10}
          width="100%"
          bg="gray.50"
        >
          <Home />
        </Flex>
        <Footer>
          <Link
            href={
              i18n.locale === 'en'
                ? 'https://www.canada.ca/en/transparency/privacy.html'
                : 'https://www.canada.ca/fr/transparence/confidentialite.html'
            }
          >
            <Trans>Privacy</Trans>
          </Link>
          <Link
            ml={4}
            href={
              i18n.locale === 'en'
                ? 'https://www.canada.ca/en/transparency/terms.html'
                : 'https://www.canada.ca/fr/transparence/avis.html'
            }
          >
            <Trans>Terms & conditions</Trans>
          </Link>
        </Footer>
      </Flex>
    </ThemeProvider>
  )
}
