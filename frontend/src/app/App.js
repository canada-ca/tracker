import React, { Suspense, useEffect } from 'react'
import { Switch, Link as RouteLink, Redirect } from 'react-router-dom'
import { i18n } from '@lingui/core'
import { CSSReset, Flex, Link } from '@chakra-ui/react'
import { t, Trans } from '@lingui/macro'
import { ErrorBoundary } from 'react-error-boundary'
import { useQuery } from '@apollo/client'

import { Main } from './Main'
import { TopBanner } from './TopBanner'
import { PhaseBanner } from './PhaseBanner'
import { Footer } from './Footer'
import { Navigation } from './Navigation'
import { SkipLink } from './SkipLink'
import { FloatingMenu } from './FloatingMenu'
import { PrivatePage } from './PrivatePage'
import { Page } from './Page'

import { wsClient } from '../client'
import { LoadingMessage } from '../components/LoadingMessage'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { useUserVar } from '../utilities/userState'
import { lazyWithRetry } from '../utilities/lazyWithRetry'

import { LandingPage } from '../landing/LandingPage'
import { NotificationBanner } from './NotificationBanner'
import { IS_LOGIN_REQUIRED } from '../graphql/queries'

const PageNotFound = lazyWithRetry(() => import('./PageNotFound'))
const CreateUserPage = lazyWithRetry(() => import('../auth/CreateUserPage'))
const DomainsPage = lazyWithRetry(() => import('../domains/DomainsPage'))
const UserPage = lazyWithRetry(() => import('../user/UserPage'))
const SignInPage = lazyWithRetry(() => import('../auth/SignInPage'))
const DmarcReportPage = lazyWithRetry(() => import('../dmarc/DmarcReportPage'))
const Organizations = lazyWithRetry(() =>
  import('../organizations/Organizations'),
)
const OrganizationDetails = lazyWithRetry(() =>
  import('../organizationDetails/OrganizationDetails'),
)
const AdminPage = lazyWithRetry(() => import('../admin/AdminPage'))
const ForgotPasswordPage = lazyWithRetry(() =>
  import('../auth/ForgotPasswordPage'),
)
const ResetPasswordPage = lazyWithRetry(() =>
  import('../auth/ResetPasswordPage'),
)
const DmarcByDomainPage = lazyWithRetry(() =>
  import('../dmarc/DmarcByDomainPage'),
)
const DmarcGuidancePage = lazyWithRetry(() =>
  import('../guidance/DmarcGuidancePage'),
)
const TermsConditionsPage = lazyWithRetry(() =>
  import('../termsConditions/TermsConditionsPage'),
)
const TwoFactorAuthenticatePage = lazyWithRetry(() =>
  import('../auth/TwoFactorAuthenticatePage'),
)
const EmailValidationPage = lazyWithRetry(() =>
  import('../auth/EmailValidationPage'),
)
const CreateOrganizationPage = lazyWithRetry(() =>
  import('../createOrganization/CreateOrganizationPage'),
)
const ContactUsPage = lazyWithRetry(() => import('./ContactUsPage'))

export function App() {
  // Hooks to be used with this functional component
  const {
    currentUser,
    isLoggedIn,
    isEmailValidated,
    currentTFAMethod,
  } = useUserVar()

  const { data } = useQuery(IS_LOGIN_REQUIRED, {})

  // Close websocket on user jwt change (refresh/logout)
  // Ready state documented at: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/readyState
  useEffect(() => {
    // User is logged out and websocket connection is active
    if (currentUser?.jwt === '' && [0, 1].includes(wsClient.status)) {
      wsClient.close()
    }
  }, [currentUser.jwt])

  return (
    <>
      <Flex direction="column" minHeight="100vh" bg="gray.50">
        <header>
          <CSSReset />
          <SkipLink invisible href="#main">
            <Trans>Skip to main content</Trans>
          </SkipLink>
          <PhaseBanner phase={<Trans>BETA</Trans>}>
            <Trans>This is a new service, we are constantly improving.</Trans>
          </PhaseBanner>
          <TopBanner />
        </header>

        <Navigation>
          <RouteLink to="/">
            <Trans>Home</Trans>
          </RouteLink>

          {((isLoggedIn() && isEmailValidated()) || !data?.loginRequired) && (
            <>
              <RouteLink to="/organizations">
                <Trans>Organizations</Trans>
              </RouteLink>
              <RouteLink to="/domains">
                <Trans>Domains</Trans>
              </RouteLink>
              <RouteLink to="/dmarc-summaries">
                <Trans>DMARC Summaries</Trans>
              </RouteLink>
            </>
          )}

          {isLoggedIn() && (
            <RouteLink to="/user">
              <Trans>Account Settings</Trans>
            </RouteLink>
          )}

          {isLoggedIn() && isEmailValidated() && (
            <RouteLink to="/admin">
              <Trans>Admin Profile</Trans>
            </RouteLink>
          )}
        </Navigation>

        {isLoggedIn() && !isEmailValidated() && (
          <NotificationBanner>
            <Trans>
              To enable full app functionality and maximize your account's
              security,{' '}
              <Link textDecoration="underline" as={RouteLink} to="/user">
                please verify your account
              </Link>
              .
            </Trans>
          </NotificationBanner>
        )}

        {isLoggedIn() && isEmailValidated() && currentTFAMethod() === 'NONE' && (
          <NotificationBanner>
            <Trans>
              Admin accounts must activate a multi-factor authentication option,{' '}
              <Link textDecoration="underline" as={RouteLink} to="/user">
                please activate MFA
              </Link>
              .
            </Trans>
          </NotificationBanner>
        )}

        <Main marginBottom={{ base: '40px', md: 'none' }}>
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

              <Page
                path="/sign-in"
                title={t`Sign In`}
                render={() => {
                  return isLoggedIn() ? (
                    <Redirect
                      to={{
                        pathname: '/',
                      }}
                    />
                  ) : (
                    <SignInPage />
                  )
                }}
              />

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

              <Page
                path="/terms-and-conditions"
                component={TermsConditionsPage}
                title={t`Terms & Conditions`}
              />

              <Page
                path="/contact-us"
                component={ContactUsPage}
                title={t`Contact Us`}
              />

              <PrivatePage
                isLoginRequired={data?.loginRequired}
                path="/organizations"
                title={t`Organizations`}
                exact
              >
                {() => (
                  <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
                    <Organizations />
                  </ErrorBoundary>
                )}
              </PrivatePage>

              <PrivatePage
                isLoginRequired={data?.loginRequired}
                path="/organizations/:orgSlug"
                setTitle={false}
                exact
              >
                {() => (
                  <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
                    <OrganizationDetails
                      isLoginRequired={data?.loginRequired}
                    />
                  </ErrorBoundary>
                )}
              </PrivatePage>

              <Page path="/admin" title={t`Admin`}>
                {isLoggedIn() && isEmailValidated() ? (
                  <AdminPage isLoginRequired={data?.loginRequired} />
                ) : (
                  <Redirect
                    to={{
                      pathname: '/sign-in',
                    }}
                  />
                )}
              </Page>

              <PrivatePage
                isLoginRequired={data?.loginRequired}
                path="/domains"
                title={t`Domains`}
                exact
              >
                {() => (
                  <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
                    <DomainsPage />
                  </ErrorBoundary>
                )}
              </PrivatePage>

              <PrivatePage
                isLoginRequired={data?.loginRequired}
                path="/domains/:domainSlug"
                setTitle={false}
                exact
              >
                {() => (
                  <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
                    <DmarcGuidancePage />
                  </ErrorBoundary>
                )}
              </PrivatePage>

              <PrivatePage
                isLoginRequired={data?.loginRequired}
                path="/domains/:domainSlug/dmarc-report/:period?/:year?"
                setTitle={false}
                exact
              >
                {() => (
                  <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
                    <DmarcReportPage />
                  </ErrorBoundary>
                )}
              </PrivatePage>

              <PrivatePage
                isLoginRequired={data?.loginRequired}
                path="/dmarc-summaries"
                title={t`DMARC Summaries`}
                exact
              >
                {() => (
                  <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
                    <DmarcByDomainPage />
                  </ErrorBoundary>
                )}
              </PrivatePage>

              <Page path="/user" title={t`Your Account`}>
                {isLoggedIn() ? (
                  <UserPage username={currentUser.userName} />
                ) : (
                  <Redirect
                    to={{
                      pathname: '/sign-in',
                    }}
                  />
                )}
              </Page>

              <Page path="/validate/:verifyToken" title={t`Email Verification`}>
                {() => <EmailValidationPage />}
              </Page>

              <Page path="/create-organization" title={t`Create Organization`}>
                {isLoggedIn() && isEmailValidated() ? (
                  <CreateOrganizationPage />
                ) : (
                  <Redirect
                    to={{
                      pathname: '/sign-in',
                    }}
                  />
                )}
              </Page>

              <Page component={PageNotFound} title="404" />
            </Switch>
          </Suspense>
        </Main>
        <FloatingMenu />

        <Footer display={{ base: 'none', md: 'inline' }}>
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

          <Link as={RouteLink} to="/terms-and-conditions" ml={4}>
            <Trans>Terms & conditions</Trans>
          </Link>

          <Link
            ml={4}
            href={'https://github.com/canada-ca/tracker/issues'}
            isExternal={true}
          >
            <Trans>Report an Issue</Trans>
          </Link>

          <Link as={RouteLink} to="/contact-us" ml={4}>
            <Trans>Contact Us</Trans>
          </Link>
        </Footer>
      </Flex>
    </>
  )
}
