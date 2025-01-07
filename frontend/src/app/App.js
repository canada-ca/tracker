import React, { Suspense } from 'react'
import { Link as RouteLink, useLocation, Routes, Route, Navigate } from 'react-router-dom'
import { AlertDescription, AlertTitle, Box, Code, CSSReset, Flex, Link, Skeleton, Text } from '@chakra-ui/react'
import { t, Trans } from '@lingui/macro'
import { ErrorBoundary } from 'react-error-boundary'

import { Main } from './Main'
import { TopBanner } from './TopBanner'
import { Footer } from './Footer'
import { Navigation } from './Navigation'
import { SkipLink } from './SkipLink'
import { FloatingMenu } from './FloatingMenu'

import { LoadingMessage } from '../components/LoadingMessage'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { useUserVar } from '../utilities/userState'
import { lazyWithRetry } from '../utilities/lazyWithRetry'

import { LandingPage } from '../landing/LandingPage'
import { NotificationBanner } from './NotificationBanner'
import { useLingui } from '@lingui/react'
import { ScrollToAnchor } from './ScrollToAnchor'
import { bool } from 'prop-types'

const GuidancePage = lazyWithRetry(() => import('../guidance/GuidancePage'))
const PageNotFound = lazyWithRetry(() => import('./PageNotFound'))
const CreateUserPage = lazyWithRetry(() => import('../auth/CreateUserPage'))
const DomainsPage = lazyWithRetry(() => import('../domains/DomainsPage'))
const UserPage = lazyWithRetry(() => import('../user/UserPage'))
const SignInPage = lazyWithRetry(() => import('../auth/SignInPage'))
const DmarcReportPage = lazyWithRetry(() => import('../dmarc/DmarcReportPage'))
const Organizations = lazyWithRetry(() => import('../organizations/Organizations'))
const OrganizationDetails = lazyWithRetry(() => import('../organizationDetails/OrganizationDetails'))
const AdminPage = lazyWithRetry(() => import('../admin/AdminPage'))
const ForgotPasswordPage = lazyWithRetry(() => import('../auth/ForgotPasswordPage'))
const ResetPasswordPage = lazyWithRetry(() => import('../auth/ResetPasswordPage'))
const DmarcByDomainPage = lazyWithRetry(() => import('../dmarc/DmarcByDomainPage'))
const TermsConditionsPage = lazyWithRetry(() => import('../termsConditions/TermsConditionsPage'))
const TwoFactorAuthenticatePage = lazyWithRetry(() => import('../auth/TwoFactorAuthenticatePage'))
const EmailValidationPage = lazyWithRetry(() => import('../auth/EmailValidationPage'))
const CreateOrganizationPage = lazyWithRetry(() => import('../createOrganization/CreateOrganizationPage'))
const ContactUsPage = lazyWithRetry(() => import('./ContactUsPage'))
const ReadGuidancePage = lazyWithRetry(() => import('./ReadGuidancePage'))
const MyTrackerPage = lazyWithRetry(() => import('../user/MyTrackerPage'))

export function App({ initialLoading, isLoginRequired }) {
  // Hooks to be used with this functional component
  const { currentUser, isLoggedIn, isEmailValidated, currentTFAMethod, hasAffiliation } = useUserVar()
  const { i18n } = useLingui()
  const location = useLocation()

  const notificationBanner = () => {
    if (isLoggedIn()) {
      if (isEmailValidated()) {
        if (currentTFAMethod() === 'NONE') {
          return (
            <NotificationBanner status="warning">
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
          )
        }
        if (!hasAffiliation()) {
          return (
            <NotificationBanner status="warning">
              <Text fontWeight="medium">
                <Trans>
                  To view detailed scan results and other functionality,{' '}
                  <Link textDecoration="underline" as={RouteLink} to="/organizations">
                    please affiliate with an organization
                  </Link>
                  .
                </Trans>
              </Text>
            </NotificationBanner>
          )
        }
      } else {
        return (
          <NotificationBanner status="warning">
            <Text fontWeight="medium">
              <Trans>
                To enable full app functionality and maximize your account's security,{' '}
                <Link textDecoration="underline" as={RouteLink} to="/user">
                  please verify your account
                </Link>
                .
              </Trans>
            </Text>
          </NotificationBanner>
        )
      }
    }
  }

  return (
    <Flex minHeight="100vh" direction="column" w="100%" bg="gray.50">
      <ScrollToAnchor />
      <header>
        <CSSReset />
        <SkipLink invisible href="#main">
          <Trans>Skip to main content</Trans>
        </SkipLink>
        <TopBanner initialLoading={initialLoading} />
      </header>
      <Navigation>
        <RouteLink to="/">
          <Trans>Home</Trans>
        </RouteLink>

        {initialLoading ? (
          <>
            <Skeleton isLoaded={!initialLoading} py="0.5">
              <Text fontWeight="bold">LoadingState</Text>
            </Skeleton>
            <Skeleton isLoaded={!initialLoading} py="0.5">
              <Text fontWeight="bold">LoadingState</Text>
            </Skeleton>
          </>
        ) : (
          <>
            {((isLoggedIn() && isEmailValidated()) || !isLoginRequired) && (
              <>
                <RouteLink to="/organizations" className="organizations-page-button">
                  <Trans>Organizations</Trans>
                </RouteLink>
                <RouteLink to="/domains">
                  <Trans>Domains</Trans>
                </RouteLink>
              </>
            )}

            {isLoggedIn() && isEmailValidated() && currentTFAMethod() !== 'NONE' && (
              <RouteLink to="/dmarc-summaries">
                <Trans>DMARC Summaries</Trans>
              </RouteLink>
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
          </>
        )}
      </Navigation>

      <NotificationBanner status="warning" hideable initialHideState={window.env?.APP_IS_PRODUCTION === true}>
        <Text fontWeight="medium">
          <Trans>
            You are current visiting a staging environment, used for testing purposes only. This is{' '}
            <b>not the live production site.</b>
            <br />
            Visit the production site at{' '}
            <Link href="https://tracker.canada.ca" isExternal={true} color="blue.500">
              https://tracker.canada.ca
            </Link>{' '}
            (GC network only).
          </Trans>
        </Text>
      </NotificationBanner>

      {notificationBanner()}

      <NotificationBanner status="info" bannerId="automatic-dkim-selectors" hideable>
        <Box>
          <AlertTitle>
            <Trans>Tracker now automatically manages your DKIM selectors.</Trans>
          </AlertTitle>
          <AlertDescription>
            <Trans>
              Manual management of DKIM selectors is discontinued. DKIM selectors will automatically be added when
              setting <Code>rua=mailto:dmarc@cyber.gc.ca</Code> in your DMARC record.{' '}
              <Link as={RouteLink} to="/guidance#dkim-selectors" color="blue.500">
                Learn more
              </Link>
              .
            </Trans>
          </AlertDescription>
        </Box>
      </NotificationBanner>

      <Main mb={{ base: '40px', md: 'none' }}>
        {initialLoading ? (
          <LoadingMessage alignSelf="center" mx="auto" />
        ) : (
          <Suspense fallback={<LoadingMessage />}>
            <Routes>
              <Route
                element={<LandingPage loginRequired={isLoginRequired} isLoggedIn={isLoggedIn()} />}
                exact
                path="/"
                title={t`Home`}
              />

              <Route element={<CreateUserPage />} path="/create-user/:userOrgToken?" title={t`Create an Account`} />

              <Route path="/sign-in" element={isLoggedIn() ? <Navigate to="/" /> : <SignInPage />} />

              <Route
                path="/authenticate/:sendMethod/:authenticateToken"
                element={<TwoFactorAuthenticatePage />}
                title={t`Authenticate`}
              />

              <Route path="/forgot-password" element={<ForgotPasswordPage />} title={t`Forgot Password`} />

              <Route path="/reset-password/:resetToken" element={<ResetPasswordPage />} title={t`Reset Password`} />

              <Route path="/terms-and-conditions" element={<TermsConditionsPage />} title={t`Terms & Conditions`} />

              <Route path="/contact-us" element={<ContactUsPage />} title={t`Contact Us`} />

              <Route path="/guidance" element={<ReadGuidancePage />} title={t`Read guidance`} />

              <Route
                path="/organizations"
                title={t`Organizations`}
                exact
                element={
                  (isLoggedIn() && isEmailValidated()) || !isLoginRequired ? (
                    <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
                      <Organizations />
                    </ErrorBoundary>
                  ) : (
                    <Navigate to="/sign-in" state={{ from: location }} />
                  )
                }
              />

              <Route
                path="/organizations/:orgSlug/:activeTab?"
                exact
                element={
                  (isLoggedIn() && isEmailValidated()) || !isLoginRequired ? (
                    <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
                      <OrganizationDetails />
                    </ErrorBoundary>
                  ) : (
                    <Navigate to="/sign-in" state={{ from: location }} />
                  )
                }
              />

              <Route
                path="/admin/:activeMenu?"
                title={t`Admin`}
                element={
                  isLoggedIn() && isEmailValidated() && currentTFAMethod() !== 'NONE' ? (
                    <AdminPage isLoginRequired={isLoginRequired} />
                  ) : (
                    <Navigate to="/sign-in" state={{ from: location }} />
                  )
                }
              />

              <Route
                path="/domains"
                title={t`Domains`}
                exact
                element={
                  (isLoggedIn() && isEmailValidated()) || !isLoginRequired ? (
                    <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
                      <DomainsPage />
                    </ErrorBoundary>
                  ) : (
                    <Navigate to="/sign-in" state={{ from: location }} />
                  )
                }
              />

              <Route
                path="/domains/:domainSlug/:activeTab?"
                exact
                element={
                  isLoggedIn() && isEmailValidated() ? (
                    <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
                      <GuidancePage />
                    </ErrorBoundary>
                  ) : (
                    <Navigate to="/sign-in" state={{ from: location }} />
                  )
                }
              />

              <Route
                path="/domains/:domainSlug/dmarc-report/:period?/:year?"
                exact
                element={
                  isLoggedIn() && isEmailValidated() ? (
                    <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
                      <DmarcReportPage />
                    </ErrorBoundary>
                  ) : (
                    <Navigate to="/sign-in" state={{ from: location }} />
                  )
                }
              />

              <Route
                path="/dmarc-summaries"
                exact
                title={t`DMARC Summaries`}
                element={
                  isLoggedIn() && isEmailValidated() ? (
                    <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
                      <DmarcByDomainPage />
                    </ErrorBoundary>
                  ) : (
                    <Navigate to="/sign-in" state={{ from: location }} />
                  )
                }
              />

              <Route
                path="/user"
                title={t`Your Account`}
                element={
                  isLoggedIn() ? (
                    <UserPage username={currentUser.userName} />
                  ) : (
                    <Navigate to="/sign-in" state={{ from: location }} />
                  )
                }
              />

              <Route
                path="/my-tracker/:activeTab?"
                title={t`myTracker`}
                element={isLoggedIn() ? <MyTrackerPage /> : <Navigate to="/sign-in" state={{ from: location }} />}
              />

              <Route path="/validate/:verifyToken" title={t`Email Verification`} element={<EmailValidationPage />} />

              <Route
                path="/create-organization"
                title={t`Create Organization`}
                element={
                  isLoggedIn() && isEmailValidated() && currentTFAMethod() !== 'NONE' ? (
                    <CreateOrganizationPage />
                  ) : (
                    <Navigate to="/sign-in" state={{ from: location }} />
                  )
                }
              />

              <Route element={<PageNotFound />} title="404" />
            </Routes>
          </Suspense>
        )}
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

        <Link as={RouteLink} to="/contact-us" ml="4" className="contact-us-button">
          <Trans>Contact Us</Trans>
        </Link>

        <Link as={RouteLink} to="/guidance" ml="4" className="guidance-button">
          <Trans>Guidance</Trans>
        </Link>
      </Footer>
    </Flex>
  )
}

App.propTypes = {
  initialLoading: bool,
  isLoginRequired: bool,
}
