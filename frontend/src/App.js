import React, { lazy, Suspense } from 'react'
import { Switch } from 'react-router-dom'
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
import PrivatePage from './PrivatePage'
import { Page } from './Page'
import { LoadingMessage } from './LoadingMessage'

const PageNotFound = lazy(() => import('./PageNotFound'))
const CreateUserPage = lazy(() => import('./CreateUserPage'))
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
const EmailValidationPage = lazy(() => import('./EmailValidationPage'))
const CreateOrganizationPage = lazy(() => import('./CreateOrganizationPage'))

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
              <Trans>DMARC Summaries</Trans>
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
          <Suspense fallback={<LoadingMessage />}>
            <Switch>
              <Page exact path="/" title={t`Home`}>
                <LandingPage />
              </Page>

              <Page
                path="/create-user/:userOrgToken?"
                title={t`Create an Account`}
              >
                <CreateUserPage />
              </Page>

              <Page path="/sign-in" component={SignInPage} title={t`Sign In`} />

              <Page
                path="/authenticate/:sendMethod/:authenticateToken"
                component={TwoFactorAuthenticatePage}
                title={t`Authenticate`}
              />

              <Page
                path="/forgot-password"
                component={ForgotPasswordPage}
                title={t`Forgot Password`}
              />

              <Page
                path="/reset-password/:resetToken"
                component={ResetPasswordPage}
                title={t`Reset Password`}
              />

              <PrivatePage path="/organizations" title={t`Organizations`} exact>
                <Organizations />
              </PrivatePage>

              <PrivatePage
                path="/organizations/:orgSlug"
                setTitle={false}
                exact
              >
                <OrganizationDetails />
              </PrivatePage>

              <PrivatePage path="/admin" title={t`Admin`}>
                <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
                  <AdminPage />
                </ErrorBoundary>
              </PrivatePage>

              <PrivatePage path="/domains" title={t`Domains`} exact>
                <DomainsPage />
              </PrivatePage>

              <PrivatePage path="/domains/:domainSlug" setTitle={false} exact>
                <DmarcGuidancePage />
              </PrivatePage>

              <PrivatePage
                path="/domains/:domainSlug/dmarc-report/:period?/:year?"
                setTitle={false}
                exact
              >
                <DmarcReportPage />
              </PrivatePage>

              <PrivatePage
                path="/dmarc-summaries"
                title={t`DMARC Summaries`}
                exact
              >
                <DmarcByDomainPage />
              </PrivatePage>

              <PrivatePage path="/user" title={t`Your Account`}>
                <UserPage username={currentUser.userName} />
              </PrivatePage>

              <Page path="/validate/:verifyToken" title={t`Email Verification`}>
                <EmailValidationPage />
              </Page>

              <PrivatePage
                path="/create-organization"
                title={t`Create Organization`}
              >
                <CreateOrganizationPage />
              </PrivatePage>

              <Page component={PageNotFound} title="404" />
            </Switch>
          </Suspense>
        </Main>
        <FloatingMenu />

        <Footer
          display={{ base: 'none', md: 'inline' }}
        >
          <div>
            <Link
              isExternal={true}
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
              isExternal={true}
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
              href={'https://github.com/canada-ca/tracker/issues'}
              isExternal={true}
            >
              <Trans>Report an Issue</Trans>
            </Link>
          </div>
        </Footer>
      </Flex>
    </>
  )
}
