/* eslint-disable react/prop-types */
/* eslint-disable no-unused-expressions */
import React, { useEffect } from 'react'
import { Route, useLocation } from 'react-router-dom'
import { useLingui } from '@lingui/react'
import { Global, css } from '@emotion/core'
import { PageNotFound } from './PageNotFound'
import { LandingPage } from './LandingPage'
import { DomainsPage } from './DomainsPage'
import { SignInPage } from './SignInPage'
import { CreateUserPage } from './CreateUserPage'
import { QRcodePage } from './QRcodePage'
import { Main } from './Main'
import { Trans } from '@lingui/macro'
import { TopBanner } from './TopBanner'
import { PhaseBanner } from './PhaseBanner'
import { Footer } from './Footer'
import { Navigation } from './Navigation'
import { Flex, Link, CSSReset } from '@chakra-ui/core'
import { SkipLink } from './SkipLink'
import { useQuery, useApolloClient } from '@apollo/react-hooks'
import gql from 'graphql-tag'
import { TwoFactorNotificationPage } from './TwoFactorNotificationPage'

export default function App() {
  const { i18n } = useLingui()

  const location = useLocation()
  const refreshComponent = React.useState()

  const GET_JWT_TOKEN = gql`
    {
      jwt @client
    }
  `

  const { data } = useQuery(GET_JWT_TOKEN)

  if(data){
    console.log(data.jwt)
  }
  const client = useApolloClient()

  useEffect(() => {

    // If the homepage is clicked, refresh the state.
    if (location.pathname === '/') {
      refreshComponent // TODO: Ask mike about unused expression.
    }
  })

  return (
    <>
      <Flex direction="column" minHeight="100vh" bg="gray.50">
        <header>
          <CSSReset />
          <Global
            styles={css`
              @import url('https://fonts.googleapis.com/css?family=Noto+Sans:400,400i,700,700i&display=swap');
            `}
          />
          <SkipLink invisible href="#main">
            <Trans>Skip to main content</Trans>
          </SkipLink>
          <PhaseBanner phase={<Trans>Pre-Alpha</Trans>}>
            <Trans>This service is being developed in the open</Trans>
          </PhaseBanner>
          <TopBanner />
        </header>
        <Navigation>
          <Link to="/">
            <Trans>Home</Trans>
          </Link>
          <Link to="/domains">
            <Trans>Domains</Trans>
          </Link>

          {// Dynamically decide if the link should be sign in or sign out.
          (data && data.jwt == null) ? (
            <Link to="/sign-in">
              <Trans>Sign In</Trans>
            </Link>
          ) : (
            <Link
              to="/"
              onClick={() => {
                // This clears the JWT, essentially logging the user out in one go
                client.writeData({ data: {jwt: null} }) // How is this done?
              }}
            >
              <Trans>Sign Out</Trans>
            </Link>
          )}
        </Navigation>
        <TwoFactorNotificationPage />
        <Main>
          <Route exact path="/">
            <LandingPage />
          </Route>

          <Route path="/domains">
            <DomainsPage />
          </Route>

          <Route path="/sign-in">
            <SignInPage />
          </Route>

          <Route path="/create-user">
            <CreateUserPage />
          </Route>

          <Route path="/two-factor-code">
            <QRcodePage userName={''} />
          </Route>

          <Route>
            <PageNotFound />
          </Route>
        </Main>
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
    </>
  )
}
