import React, { Suspense, useEffect } from 'react'
import { lazyWithRetry } from './LazyWithRetry'
import { Switch, useHistory, useLocation } from 'react-router-dom'
import { useLingui } from '@lingui/react'
import { LandingPage } from './LandingPage'
import { Main } from './Main'
import { t, Trans } from '@lingui/macro'
import { TopBanner } from './TopBanner'
import { PhaseBanner } from './PhaseBanner'
import { Footer } from './Footer'
import { Navigation } from './Navigation'
import { CSSReset, Flex, Link } from '@chakra-ui/react'
import { SkipLink } from './SkipLink'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'
import { FloatingMenu } from './FloatingMenu'
import PrivatePage from './PrivatePage'
import { Page } from './Page'
import { LoadingMessage } from './LoadingMessage'
import { useUserVar } from './UserState'
import { useMutation } from '@apollo/client'
import { REFRESH_TOKENS } from './graphql/mutations'
import { activate } from './i18n.config'

const PageNotFound = lazyWithRetry(() => import('./PageNotFound'))
const CreateUserPage = lazyWithRetry(() => import('./CreateUserPage'))
const DomainsPage = lazyWithRetry(() => import('./DomainsPage'))
const UserPage = lazyWithRetry(() => import('./UserPage'))
const SignInPage = lazyWithRetry(() => import('./SignInPage'))
const DmarcReportPage = lazyWithRetry(() => import('./DmarcReportPage'))
const Organizations = lazyWithRetry(() => import('./Organizations'))
const OrganizationDetails = lazyWithRetry(() => import('./OrganizationDetails'))
const AdminPage = lazyWithRetry(() => import('./AdminPage'))
const ForgotPasswordPage = lazyWithRetry(() => import('./ForgotPasswordPage'))
const ResetPasswordPage = lazyWithRetry(() => import('./ResetPasswordPage'))
const DmarcByDomainPage = lazyWithRetry(() => import('./DmarcByDomainPage'))
const DmarcGuidancePage = lazyWithRetry(() => import('./DmarcGuidancePage'))
const TermsConditionsPage = lazyWithRetry(() => import('./TermsConditionsPage'))
const TwoFactorAuthenticatePage = lazyWithRetry(() =>
  import('./TwoFactorAuthenticatePage'),
)
const EmailValidationPage = lazyWithRetry(() => import('./EmailValidationPage'))
const CreateOrganizationPage = lazyWithRetry(() =>
  import('./CreateOrganizationPage'),
)

export default function App() {
  // Hooks to be used with this functional component
  const { i18n } = useLingui()
  const history = useHistory()
  const location = useLocation()
  const { currentUser, isLoggedIn, login } = useUserVar()
  const { from } = location.state || { from: { pathname: '/' } }

  const [refreshTokens, { _loading }] = useMutation(REFRESH_TOKENS, {
    onError(error) {
      console.error(error.message)
    },
    onCompleted({ refreshTokens }) {
      if (refreshTokens.result.__typename === 'AuthResult') {
        login({
          jwt: refreshTokens.result.authToken,
          tfaSendMethod: refreshTokens.result.user.tfaSendMethod,
          userName: refreshTokens.result.user.userName,
        })
        if (refreshTokens.result.user.preferredLang === 'ENGLISH')
          activate('en')
        else if (refreshTokens.result.user.preferredLang === 'FRENCH')
          activate('fr')
        history.replace(from)
        console.log('successfully refreshed tokens')
      }
      // Non server error occurs
      else if (refreshTokens.result.__typename === 'AuthenticateError') {
        console.warn('Unable to refresh tokens. Please sign in.')
      } else {
        console.warn('Incorrect authenticate.result typename.')
      }
    },
  })

  useEffect(() => {
    refreshTokens()
  }, [refreshTokens])

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
        </Navigation>

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

              <Page
                path="/terms-and-conditions"
                component={TermsConditionsPage}
                title={t`Terms & Conditions`}
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

        <Footer display={{ base: 'none', md: 'inline' }}>
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

            <Link href="/terms-and-conditions" ml={4}>
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
