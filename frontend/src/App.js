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
import { Flex, Link, CSSReset } from '@chakra-ui/core'
import { SkipLink } from './SkipLink'
import { TwoFactorNotificationBar } from './TwoFactorNotificationBar'
import { UserPage } from './UserPage'
import { UserList } from './UserList'
import { useUserState } from './UserState'

export default function App() {
  // Hooks to be used with this functional component
  const { i18n } = useLingui()
  const { currentUser, isLoggedIn } = useUserState()

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

          {isLoggedIn() ? (
            <Link to="/user">
              <Trans>User Profile</Trans>
            </Link>
          ) : (
            <Link to="/sign-in">
              <Trans>Sign In</Trans>
            </Link>
          )}
          <Link to="/user-list">
            <Trans>User List</Trans>
          </Link>
        </Navigation>
        {isLoggedIn() && !currentUser.tfa && <TwoFactorNotificationBar />}
        <Main>
          <Route exact path="/">
            <LandingPage />
          </Route>

          <Route path="/domains">
            <DomainsPage />
          </Route>

          {isLoggedIn() && (
            <Route path="/user">
              <UserPage userName={currentUser.userName} />
            </Route>
          )}

          <Route path="/sign-in">
            <SignInPage />
          </Route>

          <Route path="/create-user">
            <CreateUserPage />
          </Route>

          {isLoggedIn() && (
            <Route path="/two-factor-code">
              <QRcodePage userName={currentUser.userName} />
            </Route>
          )}

          <Route path="/user-list">
            <UserList />
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
