import React, { Suspense } from 'react'
// import { Routes, Route, Link as RouteLink, Navigate, useLocation } from 'react-router-dom'
import { Routes, Route, Link as RouteLink, Navigate } from 'react-router-dom'
import { AlertDescription, AlertTitle, Box, Code, CSSReset, Flex, Link, Skeleton, Text } from '@chakra-ui/react'
import { t, Trans } from '@lingui/macro'
// import { ErrorBoundary } from 'react-error-boundary'

import { Main } from './Main'
import { TopBanner } from './TopBanner'
import { Footer } from './Footer'
import { Navigation } from './Navigation'
import { SkipLink } from './SkipLink'
import { FloatingMenu } from './FloatingMenu'
import { PrivatePage } from './PrivatePage'
import { Page } from './Page'

import { LoadingMessage } from '../components/LoadingMessage'
// import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
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
  // const { currentUser, isLoggedIn, isEmailValidated, currentTFAMethod, hasAffiliation } = useUserVar()
  const { isLoggedIn, isEmailValidated, currentTFAMethod, hasAffiliation } = useUserVar()
  const { i18n } = useLingui()
  // const location = useLocation()

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
                path="/"
                element={
                  <Page title={t`Home`}>
                    <LandingPage loginRequired={isLoginRequired} isLoggedIn={isLoggedIn()} />
                  </Page>
                }
              />
              <Route
                path="/create-user/:userOrgToken?"
                element={
                  <Page title={t`Create an Account`}>
                    <CreateUserPage />
                  </Page>
                }
              />
              <Route path="/sign-in" element={isLoggedIn() ? <Navigate to="/" /> : <SignInPage />} />
              <Route
                path="/authenticate/:sendMethod/:authenticateToken"
                element={
                  <Page title={t`Authenticate`}>
                    <TwoFactorAuthenticatePage />
                  </Page>
                }
              />
              <Route
                path="/forgot-password"
                element={
                  <Page title={t`Forgot Password`}>
                    <ForgotPasswordPage />
                  </Page>
                }
              />
              <Route
                path="/reset-password/:resetToken"
                element={
                  <Page title={t`Reset Password`}>
                    <ResetPasswordPage />
                  </Page>
                }
              />
              <Route
                path="/terms-and-conditions"
                element={
                  <Page title={t`Terms & Conditions`}>
                    <TermsConditionsPage />
                  </Page>
                }
              />
              <Route
                path="/contact-us"
                element={
                  <Page title={t`Contact Us`}>
                    <ContactUsPage />
                  </Page>
                }
              />
              <Route
                path="/guidance"
                element={
                  <Page title={t`Read guidance`}>
                    <ReadGuidancePage />
                  </Page>
                }
              />
              <Route
                path="/organizations"
                element={
                  <PrivatePage isLoginRequired={isLoginRequired} title={t`Organizations`}>
                    <Organizations />
                  </PrivatePage>
                }
              />
              <Route
                path="/organizations/:orgSlug/:activeTab?"
                element={
                  <PrivatePage isLoginRequired={isLoginRequired}>
                    <OrganizationDetails />
                  </PrivatePage>
                }
              />
              <Route
                path="/admin/:activeMenu?"
                element={
                  <PrivatePage
                    title={t`Admin`}
                    isLoginRequired={isLoginRequired}
                    isAuthed={isLoggedIn() && isEmailValidated() && currentTFAMethod() !== 'NONE'}
                    redirectTo={'/'}
                  >
                    <AdminPage />
                  </PrivatePage>
                }
              />
              <Route
                path="/dmarc-summaries"
                element={
                  <PrivatePage isLoginRequired={isLoginRequired}>
                    <DmarcReportPage />
                  </PrivatePage>
                }
              />
              <Route
                path="/dmarc-by-domain/:domainSlug"
                element={
                  <PrivatePage isLoginRequired={isLoginRequired}>
                    <DmarcByDomainPage />
                  </PrivatePage>
                }
              />
              <Route
                path="/my-tracker"
                element={
                  <PrivatePage isLoginRequired={isLoginRequired}>
                    <MyTrackerPage />
                  </PrivatePage>
                }
              />
              <Route path="*" element={<PageNotFound />} />
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

        <Link as={RouteLink} to="/guidance" ml="4">
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
