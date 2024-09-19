import React, { Suspense } from 'react'
import { Routes, Route, Link as RouteLink, Navigate, useLocation, useRoutes } from 'react-router-dom'
import { AlertDescription, AlertTitle, Box, Code, CSSReset, Flex, Link, Skeleton, Text } from '@chakra-ui/react'
import { t, Trans } from '@lingui/macro'
import { ErrorBoundary } from 'react-error-boundary'

import { Main } from './Main'
import { TopBanner } from './TopBanner'
import { Footer } from './Footer'
import { Navigation } from './Navigation'
import { SkipLink } from './SkipLink'
import { FloatingMenu } from './FloatingMenu'
import { PrivatePage } from './PrivatePage'
import { Page } from './Page'

import { LoadingMessage } from '../components/LoadingMessage'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { useUserVar } from '../utilities/userState'
import { lazyWithRetry } from '../utilities/lazyWithRetry'

import { LandingPage } from '../landing/LandingPage'
import { NotificationBanner } from './NotificationBanner'
import { IS_LOGIN_REQUIRED } from '../graphql/queries'
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

  const routes = [
    { path: "/", element: <LandingPage loginRequired={isLoginRequired} isLoggedIn={isLoggedIn()} /> },
    { path: "create-user/:userOrgToken?", element: <CreateUserPage /> },
    { path: "sign-in", element: isLoggedIn() ? <Navigate to="/" /> : <SignInPage /> },
    { path: "authenticate/:sendMethod/:authenticateToken", element: <TwoFactorAuthenticatePage /> },
    { path: "forgot-password", element: <ForgotPasswordPage /> },
    { path: "reset-password/:resetToken", element: <ResetPasswordPage /> },
    { path: "terms-and-conditions", element: <TermsConditionsPage /> },
    { path: "contact-us", element: <ContactUsPage /> },
    { path: "guidance", element: <ReadGuidancePage /> },

    {
      path: "organizations",
      element: <PrivatePage isLoginRequired={isLoginRequired}><Organizations /></PrivatePage>,
    },
    {
      path: "organizations/:orgSlug/:activeTab?",
      element: <PrivatePage isLoginRequired={isLoginRequired}><OrganizationDetails /></PrivatePage>,
    },
    {
      path: "admin/:activeMenu?",
      element: isLoggedIn() && isEmailValidated() && currentTFAMethod() !== 'NONE' ? (
        <AdminPage isLoginRequired={isLoginRequired} />
      ) : (
        <Navigate to="/sign-in" state={{ from: location }} />
      ),
    },
    {
      path: "domains",
      element: <PrivatePage isLoginRequired={isLoginRequired}><DomainsPage /></PrivatePage>,
    },
    {
      path: "domains/:domainSlug/:activeTab?",
      element: <PrivatePage isLoginRequired={true}><GuidancePage /></PrivatePage>,
    },
    {
      path: "domains/:domainSlug/dmarc-report/:period?/:year?",
      element: <PrivatePage isLoginRequired={true}><DmarcReportPage /></PrivatePage>,
    },
    {
      path: "dmarc-summaries",
      element: <PrivatePage isLoginRequired={true}><DmarcByDomainPage /></PrivatePage>,
    },
    {
      path: "user",
      element: isLoggedIn() ? <UserPage username={currentUser.userName} /> : <Navigate to="/sign-in" state={{ from: location }} />,
    },
    {
      path: "my-tracker/:activeTab?",
      element: isLoggedIn() ? <MyTrackerPage /> : <Navigate to="/sign-in" state={{ from: location }} />,
    },
    {
      path: "validate/:verifyToken",
      element: <EmailValidationPage />,
    },
    {
      path: "create-organization",
      element: isLoggedIn() && isEmailValidated() && currentTFAMethod() !== 'NONE' ? (
        <CreateOrganizationPage />
      ) : (
        <Navigate to="/sign-in" state={{ from: location }} />
      ),
    },
    { path: "*", element: <PageNotFound /> },
  ]

  const element = useRoutes(routes)

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
                <RouteLink to="/organizations">
                  <Trans>Organizations</Trans>
                </RouteLink>
                <RouteLink to="/user">
                  <Trans>User</Trans>
                </RouteLink>
              </>
            )}
            <RouteLink to="/my-tracker">
              <Trans>My Tracker</Trans>
            </RouteLink>
            <RouteLink to="/contact-us">
              <Trans>Contact Us</Trans>
            </RouteLink>
          </>
        )}
      </Navigation>
      <Box as="main" id="main" flex="1">
        {notificationBanner()}
        {element}
      </Box>
      <Footer />
      <FloatingMenu />
    </Flex>
  )
}
