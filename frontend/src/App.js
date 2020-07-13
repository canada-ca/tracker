import React, { Suspense, lazy } from 'react'
import { Route, Switch } from 'react-router-dom'
import { useLingui } from '@lingui/react'
import { LandingPage } from './LandingPage'
import { Main } from './Main'
import { Trans } from '@lingui/macro'
import { TopBanner } from './TopBanner'
import { PhaseBanner } from './PhaseBanner'
import { Footer } from './Footer'
import { Navigation } from './Navigation'
import { Flex, Link, CSSReset } from '@chakra-ui/core'
import { SkipLink } from './SkipLink'
import { TwoFactorNotificationBar } from './TwoFactorNotificationBar'
import { useUserState } from './UserState'
import { RouteIf } from './RouteIf'

const PageNotFound = lazy(() => import('./PageNotFound'))
const DomainsPage = lazy(() => import('./DomainsPage'))
const CreateUserPage = lazy(() => import('./CreateUserPage'))
const QRcodePage = lazy(() => import('./QRcodePage'))
const UserPage = lazy(() => import('./UserPage'))
const UserList = lazy(() => import('./UserList'))
const SignInPage = lazy(() => import('./SignInPage'))
const DmarcReportPage = lazy(() => import('./DmarcReportPage'))
const Organizations = lazy(() => import('./Organizations'))
const OrganizationDetails = lazy(() => import('./OrganizationDetails'))
const AdminPage = lazy(() => import('./AdminPage'))
const ForgotPasswordPage = lazy(() => import('./ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./ResetPasswordPage'))

export default function App() {
  // Hooks to be used with this functional component
  const { i18n } = useLingui()
  const { currentUser, isLoggedIn } = useUserState()

  return (
    <>
      <Flex direction="column" minHeight="100vh" bg="gray.50">
        <header>
          <CSSReset />
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

          <Link to="/organizations">
            <Trans>Organizations</Trans>
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

          <Link to="/dmarc-report">
            <Trans>Report</Trans>
          </Link>

          {isLoggedIn() && (
            <Link to="/admin">
              <Trans>Admin Portal</Trans>
            </Link>
          )}
        </Navigation>
        {isLoggedIn() && !currentUser.tfa && <TwoFactorNotificationBar />}
        <Main>
          <Suspense fallback={<div>Loading...</div>}>
            <Switch>
              <Route exact path="/">
                <LandingPage />
              </Route>

              <Route path="/create-user">
                <CreateUserPage />
              </Route>

              <Route path="/sign-in" component={SignInPage} />

              <Route path="/forgot-password" component={ForgotPasswordPage} />

              <Route path="/reset-password/:resetToken" component={ResetPasswordPage} />

              <RouteIf
                condition={isLoggedIn()}
                alternate="/sign-in"
                path="/organizations"
                render={({ match: { url } }) => (
                  <>
                    <Route path={`${url}`} component={Organizations} exact />
                    <Route
                      path={`${url}/:orgSlug`}
                      component={OrganizationDetails}
                    />
                  </>
                )}
              />

              <RouteIf
                condition={isLoggedIn()}
                alternate="/sign-in"
                path="/admin"
              >
                <AdminPage />
              </RouteIf>

              <RouteIf
                condition={isLoggedIn()}
                alternate="/sign-in"
                path="/user-list"
              >
                <UserList />
              </RouteIf>
              <RouteIf
                condition={isLoggedIn()}
                alternate="/sign-in"
                path="/domains"
              >
                <DomainsPage />
              </RouteIf>

              <RouteIf
                condition={isLoggedIn()}
                alternate="/sign-in"
                path="/user"
              >
                <UserPage userName={currentUser.userName} />
              </RouteIf>

              <RouteIf
                condition={isLoggedIn()}
                alternate="/sign-in"
                path="/two-factor-code"
              >
                <QRcodePage userName={currentUser.userName} />
              </RouteIf>

              <Route path="/dmarc-report">
                <DmarcReportPage />
              </Route>

              <Route component={PageNotFound} />
            </Switch>
          </Suspense>
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
