import React, { Suspense, useEffect } from 'react'
import {
  Switch,
  Link as RouteLink,
  Redirect,
  useLocation,
} from 'react-router-dom'
import {
  Alert,
  AlertIcon,
  AlertTitle,
  Box,
  CloseButton,
  CSSReset,
  Flex,
  Link,
  Text,
  useDisclosure,
} from '@chakra-ui/react'
import { t, Trans } from '@lingui/macro'
import { ErrorBoundary } from 'react-error-boundary'
import { useQuery } from '@apollo/client'

import { Main } from './Main'
import { TopBanner } from './TopBanner'
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
import { useLingui } from '@lingui/react'

const GuidancePage = lazyWithRetry(() => import('../guidance/GuidancePage'))
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
const ReadGuidancePage = lazyWithRetry(() => import('./ReadGuidancePage'))
const MyTrackerPage = lazyWithRetry(() => import('../user/MyTrackerPage'))

export function App() {
  // Hooks to be used with this functional component
  const { currentUser, isLoggedIn, isEmailValidated, currentTFAMethod } =
    useUserVar()
  const { i18n } = useLingui()
  const { data } = useQuery(IS_LOGIN_REQUIRED, {})
  const { isOpen: isVisible, onClose } = useDisclosure({ defaultIsOpen: true })
  const location = useLocation()

  // Close websocket on user jwt change (refresh/logout)
  // Ready state documented at: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/readyState
  useEffect(() => {
    // User is logged out and websocket connection is active
    if (currentUser?.jwt === '' && [0, 1].includes(wsClient.status)) {
      wsClient.close()
    }
  }, [currentUser.jwt])

  return (
    <Flex minHeight="100vh" direction="column" w="100%" bg="gray.50">
      <header>
        <CSSReset />
        <SkipLink invisible href="#main">
          <Trans>Skip to main content</Trans>
        </SkipLink>
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
          <>
            <RouteLink to="/my-tracker">
              <Trans>myTracker</Trans>
            </RouteLink>

            <RouteLink to="/user">
              <Trans>Account Settings</Trans>
            </RouteLink>
          </>
        )}

        {isLoggedIn() && isEmailValidated() && currentTFAMethod() !== 'NONE' && (
          <>
            <RouteLink to="/admin">
              <Trans>Admin Profile</Trans>
            </RouteLink>
          </>
        )}
      </Navigation>

      {isLoggedIn() && !isEmailValidated() && (
        <NotificationBanner bg="yellow.250">
          <Text fontWeight="medium">
            <Trans>
              To enable full app functionality and maximize your account's
              security,{' '}
              <Link textDecoration="underline" as={RouteLink} to="/user">
                please verify your account
              </Link>
              .
            </Trans>
          </Text>
        </NotificationBanner>
      )}

      {isLoggedIn() && isEmailValidated() && currentTFAMethod() === 'NONE' && (
        <NotificationBanner bg="yellow.250">
          <Text fontWeight="medium">
            <Trans>
              To maximize your account's security,{' '}
              <Link textDecoration="underline" as={RouteLink} to="/user">
                please activate a multi-factor authentication option
              </Link>
              .
            </Trans>
          </Text>
        </NotificationBanner>
      )}
      {isVisible && (
        <Alert status="warning" variant="left-accent" mx="4" my="2" maxW="98%">
          <AlertIcon />
          <Box>
            <AlertTitle>
              <Trans>Attention Tracker Users</Trans>
            </AlertTitle>
            <Text>
              <Trans>
                In an effort to consolidate a complete list of digital services
                across the GC, new domains will be added to all organizations.
                To allow organization admins time to react to this change, new
                domains will be tagged as "new" for easy identification and
                hidden from affecting summary scores. For more information,{' '}
                <Link color="blue.600" href="">
                  see the full blog post here
                </Link>
                . Thank you for helping make GC cyber space safer for all.
              </Trans>
            </Text>
          </Box>
          <CloseButton
            alignSelf="flex-start"
            position="relative"
            right={-1}
            top={-1}
            onClick={onClose}
          />
        </Alert>
      )}

      <Main mb={{ base: '40px', md: 'none' }}>
        <Suspense fallback={<LoadingMessage />}>
          <Switch>
            <Page exact path="/" title={t`Home`}>
              <LandingPage
                loginRequired={data?.loginRequired}
                isLoggedIn={isLoggedIn()}
              />
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

            <Page
              path="/guidance"
              component={ReadGuidancePage}
              title={t`Read guidance`}
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
              path="/organizations/:orgSlug/:activeTab?"
              setTitle={false}
              exact
            >
              {() => (
                <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
                  <OrganizationDetails />
                </ErrorBoundary>
              )}
            </PrivatePage>

            <Page path="/admin/:activeMenu?" title={t`Admin`}>
              {isLoggedIn() &&
              isEmailValidated() &&
              currentTFAMethod() !== 'NONE' ? (
                <AdminPage isLoginRequired={data?.loginRequired} />
              ) : (
                <Redirect
                  to={{
                    pathname: '/sign-in',
                    state: { from: location },
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
              path="/domains/:domainSlug/:activeTab?"
              setTitle={false}
              exact
            >
              {() => (
                <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
                  <GuidancePage />
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
                    state: { from: location },
                  }}
                />
              )}
            </Page>

            <Page path="/my-tracker/:activeTab?" title={t`myTracker`}>
              {isLoggedIn() ? (
                <MyTrackerPage />
              ) : (
                <Redirect
                  to={{
                    pathname: '/sign-in',
                    state: { from: location },
                  }}
                />
              )}
            </Page>

            <Page path="/validate/:verifyToken" title={t`Email Verification`}>
              {() => <EmailValidationPage />}
            </Page>

            <Page path="/create-organization" title={t`Create Organization`}>
              {isLoggedIn() &&
              isEmailValidated() &&
              currentTFAMethod() !== 'NONE' ? (
                <CreateOrganizationPage />
              ) : (
                <Redirect
                  to={{
                    pathname: '/sign-in',
                    state: { from: location },
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
          ml="4"
        >
          <Trans>Privacy</Trans>
        </Link>

        <Link as={RouteLink} to="/terms-and-conditions" ml="4">
          <Trans>Terms & conditions</Trans>
        </Link>

        <Link
          href={'https://github.com/canada-ca/tracker/issues'}
          isExternal={true}
          ml="4"
        >
          <Trans>Report an Issue</Trans>
        </Link>

        <Link as={RouteLink} to="/contact-us" ml="4">
          <Trans>Contact Us</Trans>
        </Link>

        <Link as={RouteLink} to="/guidance" ml="4">
          <Trans>Guidance</Trans>
        </Link>
      </Footer>
    </Flex>
  )
}
