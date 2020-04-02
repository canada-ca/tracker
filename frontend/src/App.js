import React from 'react'
import { Route } from 'react-router-dom'
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
import { Flex, Link, CSSReset, useToast } from '@chakra-ui/core'
import { SkipLink } from './SkipLink'
import { useQuery, useApolloClient } from '@apollo/react-hooks'
import gql from 'graphql-tag'
import { TwoFactorNotificationBar } from './TwoFactorNotificationBar'
import { UserList } from './UserList'
import { DmarcReportPage } from './DmarcReportPage'


export default function App() {
  // Hooks to be used with this functional component
  const GET_JWT_TOKEN = gql`
    {
      jwt @client
      tfa @client
    }
  `
  const { i18n } = useLingui()
  const toast = useToast()
  const client = useApolloClient()
  const { data } = useQuery(GET_JWT_TOKEN)

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
          (data && data.jwt === null) || data === undefined ? (
            <Link to="/sign-in">
              <Trans>Sign In</Trans>
            </Link>
          ) : (
            <Link
              to="/"
              onClick={() => {
                // This clears the JWT, essentially logging the user out in one go
                client.writeData({ data: { jwt: null } }) // How is this done?
                toast({
                  title: 'Sign Out.',
                  description: 'You have successfully been signed out.',
                  status: 'success',
                  duration: 9000,
                  isClosable: true,
                })
              }}
            >
              <Trans>Sign Out</Trans>
            </Link>
          )}
          <Link to="/user-list">
            <Trans>User List</Trans>
          </Link>
          <Link to="/dmarc-report">
            <Trans>DMARC</Trans>
          </Link>
        </Navigation>
        {// Dynamically show the TwoFactorNotification bar
        data && !data.tfa && <TwoFactorNotificationBar />}
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

          <Route path="/user-list">
            <UserList />
          </Route>
          <Route path="/dmarc-report">
            <DmarcReportPage />

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
