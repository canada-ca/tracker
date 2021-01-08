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
import { Flex, Link, CSSReset, useToast, Box } from '@chakra-ui/core'
import { SkipLink } from './SkipLink'
// import { TwoFactorNotificationBar } from './TwoFactorNotificationBar'
import { useUserState } from './UserState'
import { RouteIf } from './RouteIf'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'
import { FloatingMenu } from './FloatingMenu'

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

          <Link to="/organizations">
            <Trans>Organizations</Trans>
          </Link>

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
              <Trans>User Profile</Trans>
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

              <Route
                alternate="/sign-in"
                path="/organizations"
                render={({ match: { url } }) => (
                  <>
                    <Route path={`${url}`} component={Organizations} exact />
                    <Route
                      path={`${url}/:orgSlug`}
                      component={OrganizationDetails}
                      exact
                    />
                  </>
                )}
              />

              <RouteIf
                condition={isLoggedIn()}
                alternate="/sign-in"
                path="/admin"
              >
                <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
                  <AdminPage />
                </ErrorBoundary>
              </RouteIf>

              <RouteIf
                condition={true}
                alternate="/sign-in"
                path="/domains"
                render={({ match: { url } }) => (
                  <>
                    <Route path={`${url}`} component={DomainsPage} exact />
                    <Route
                      path={`${url}/:domainSlug`}
                      component={DmarcGuidancePage}
                      exact
                    />
                    <Route
                      path={`${url}/:domainSlug/dmarc-report/:period?/:year?`}
                      component={DmarcReportPage}
                      exact
                    />
                  </>
                )}
              />

              <RouteIf
                condition={true}
                alternate="/sign-in"
                path="/dmarc-summaries"
                render={({ match: { url } }) => (
                  <>
                    <Route
                      path={`${url}`}
                      component={DmarcByDomainPage}
                      exact
                    />
                  </>
                )}
              />

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

              <RouteIf
                condition={true}
                alternate="/sign-in"
                path="/dmarc-report/:period?/:year?"
              >
                <DmarcReportPage />
              </RouteIf>

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
        <FloatingMenu />
        <Box h="40px" />
      </Flex>
    </>
  )
}
