import React, { lazy, Suspense } from 'react'
import { Route, Switch } from 'react-router-dom'
import { useLingui } from '@lingui/react'
import { LandingPage } from './LandingPage'
import { Main } from './Main'
import { Trans, t } from '@lingui/macro'
import { TopBanner } from './TopBanner'
import { PhaseBanner } from './PhaseBanner'
import { Footer } from './Footer'
import { Navigation } from './Navigation'
import { Flex, Link, CSSReset, useToast } from '@chakra-ui/core'
import { SkipLink } from './SkipLink'
// import { TwoFactorNotificationBar } from './TwoFactorNotificationBar'
import { useUserState } from './UserState'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'
import { FloatingMenu } from './FloatingMenu'
import PrivateRoute from './PrivateRoute'

const PageNotFound = lazy(() => import('./PageNotFound'))
const CreateUserPage = lazy(() => import('./CreateUserPage'))
const QRcodePage = lazy(() => import('./QRcodePage'))
const DomainsPage = lazy(() => import('./DomainsPage'))
const UserPage = lazy(() => import('./UserPage'))
const SignInPage = lazy(() => import('./SignInPage'))
const DmarcReportPage = lazy(() => import('./DmarcReportPage'))
const Organizations = lazy(() => import('./Organizations'))
const OrganizationDetails = lazy(() => import('./OrganizationDetails'))
const AdminPage = lazy(() => import('./AdminPage'))
const ForgotPasswordPage = lazy(() => import('./ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./ResetPasswordPage'))
const DmarcByDomainPage = lazy(() => import('./DmarcByDomainPage'))
const DmarcGuidancePage = lazy(() => import('./DmarcGuidancePage'))
const TwoFactorAuthenticatePage = lazy(() =>
  import('./TwoFactorAuthenticatePage'),
)

export default function App() {
  // Hooks to be used with this functional component
  const { i18n } = useLingui()
  const toast = useToast()
  const { currentUser, isLoggedIn, logout } = useUserState()

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

          {isLoggedIn() && (
            <Link to="/organizations">
              <Trans>Organizations</Trans>
            </Link>
          )}

          {isLoggedIn() && (
            <Link to="/domains">
              <Trans>Domains</Trans>
            </Link>
          )}

          {isLoggedIn() && (
            <Link to="/dmarc-summaries">
              <Trans>DMARC Report</Trans>
            </Link>
          )}

          {isLoggedIn() && (
            <Link to="/user">
              <Trans>Account Settings</Trans>
            </Link>
          )}

          {isLoggedIn() && (
            <Link to="/admin">
              <Trans>Admin Profile</Trans>
            </Link>
          )}

          {isLoggedIn() ? (
            <Link
              to="/"
              onClick={() => {
                logout()
                toast({
                  title: t`Sign Out.`,
                  description: t`You have successfully been signed out.`,
                  status: 'success',
                  duration: 9000,
                  isClosable: true,
                  position: 'top-left',
                })
              }}
              ml={[null, 'auto']}
            >
              <Trans>Sign Out</Trans>
            </Link>
          ) : (
            <Link to="/sign-in" ml={[null, 'auto']}>
              <Trans>Sign In</Trans>
            </Link>
          )}
        </Navigation>

        {/* {isLoggedIn() && !currentUser.tfa && <TwoFactorNotificationBar />} */}
        <Main>
          <Suspense fallback={<div>Loading...</div>}>
            <Switch>
              <Route exact path="/">
                <LandingPage />
              </Route>

              <Route path="/create-user/:userOrgToken?">
                <CreateUserPage />
              </Route>

              <Route path="/sign-in" component={SignInPage} />

              <Route
                path="/authenticate/:sendMethod/:authenticateToken"
                component={TwoFactorAuthenticatePage}
              />

              <Route path="/forgot-password" component={ForgotPasswordPage} />

              <Route
                path="/reset-password/:resetToken"
                component={ResetPasswordPage}
              />

              <PrivateRoute path="/organizations" exact>
                <Organizations />
              </PrivateRoute>

              <PrivateRoute path="/organizations/:orgSlug" exact>
                <OrganizationDetails />
              </PrivateRoute>

              <PrivateRoute path="/admin">
                <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
                  <AdminPage />
                </ErrorBoundary>
              </PrivateRoute>

              <PrivateRoute path="/domains" exact>
                <DomainsPage />
              </PrivateRoute>

              <PrivateRoute path="/domains/:domainSlug" exact>
                <DmarcGuidancePage />
              </PrivateRoute>

              <PrivateRoute
                path="/domains/:domainSlug/dmarc-report/:period?/:year?"
                exact
              >
                <DmarcReportPage />
              </PrivateRoute>

              <PrivateRoute path="/dmarc-summaries" exact>
                <DmarcByDomainPage />
              </PrivateRoute>

              <PrivateRoute path="/user">
                <UserPage username={currentUser.userName} />
              </PrivateRoute>

              <PrivateRoute path="/two-factor-code">
                <QRcodePage userName={currentUser.userName} />
              </PrivateRoute>

              <PrivateRoute path="/dmarc-report/:period?/:year?">
                <DmarcReportPage />
              </PrivateRoute>

              <Route component={PageNotFound} />
            </Switch>
          </Suspense>
        </Main>
        <FloatingMenu />
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
          <Link
            ml={4}
            href={"https://github.com/canada-ca/tracker/issues"}
            target={"_blank"}
          >
            <Trans>Report an Issue</Trans>
          </Link>
        </Footer>
      </Flex>
    </>
  )
}
