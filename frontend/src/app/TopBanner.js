import React from 'react'
import { t, Trans } from '@lingui/macro'
import { Box, Button, Flex, useToast, Image, Link, Skeleton } from '@chakra-ui/react'
import { Link as RouteLink } from 'react-router-dom'
import { useMutation } from '@apollo/client'

import sigEn from '../images/goc-header-logo-dark-en.svg'
import sigFr from '../images/goc-header-logo-dark-fr.svg'
import trackerLogo from '../images/tracker_v-03-transparent 2.svg'
import trackerText from '../images/trackerlogo 1.svg'

import { LocaleSwitcher } from './LocaleSwitcher'

import { Layout } from '../components/Layout'
import { useUserVar } from '../utilities/userState'
import { SIGN_OUT } from '../graphql/mutations'
import { PhaseBanner } from './PhaseBanner'
import { useLingui } from '@lingui/react'
import { ABTestWrapper, ABTestVariant } from './ABTestWrapper'
import { bool } from 'prop-types'
import { TourButton } from '../userOnboarding/components/TourButton'

export const TopBanner = ({ initialLoading, ...props }) => {
  const { isLoggedIn, logout } = useUserVar()
  const toast = useToast()
  const { i18n } = useLingui()

  const [signOut] = useMutation(SIGN_OUT, {
    onError(error) {
      toast({
        title: error.message,
        description: t`An error occurred when you attempted to sign out`,
        status: 'error',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    },
    onCompleted() {
      logout()
      toast({
        title: t`Sign Out.`,
        description: t`You have successfully been signed out.`,
        status: 'success',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    },
  })

  return (
    <Layout>
      <Flex align="center" fontFamily="body" flexWrap="wrap" {...props}>
        <Link href="https://www.canada.ca/" isExternal>
          <Flex>
            <Box ml="8" mr="4" width={{ base: 272, md: 360 }} display={{ base: 'none', md: 'initial' }}>
              <Image
                src={i18n.locale === 'en' ? sigEn : sigFr}
                pr="auto"
                py="6"
                minHeight="41px"
                alt={t`Symbol of the Government of Canada`}
              />
            </Box>
          </Flex>
        </Link>

        <Link as={RouteLink} to="/">
          <Flex align="center">
            <Box my="4" mx="2" width={{ base: 0, md: 125 }} display={{ base: 'none', md: 'initial' }}>
              <Image src={trackerLogo} alt={t`Tracker logo outline`} />
            </Box>
            <Box mx="2" mt="0" width={{ base: 0, md: 200 }} display={{ base: 'none', md: 'initial' }}>
              <Image src={trackerText} alt={t`Tracker logo text`} />
            </Box>
          </Flex>
        </Link>

        <PhaseBanner
          phase={
            <ABTestWrapper insiderVariantName="B">
              <ABTestVariant name="A">
                <Trans>BETA</Trans>
              </ABTestVariant>
              <ABTestVariant name="B">
                <Trans>PREVIEW</Trans>
              </ABTestVariant>
            </ABTestWrapper>
          }
          ml="8"
          mr="2"
          flexShrink="0"
        >
          <Trans>This is a new service, we are constantly improving.</Trans>
        </PhaseBanner>

        <Flex align="center" ml="auto">
          <TourButton />
          <LocaleSwitcher py="4" mx="2" ml={{ base: 'auto', md: '0' }} />
          {initialLoading ? (
            <>
              <Skeleton display={{ base: 'none', md: 'inline' }} mr="2">
                <Button variant="primaryWhite" px="3">
                  <Trans>Sign In</Trans>
                </Button>
              </Skeleton>
              <Skeleton display={{ base: 'none', md: 'inline' }}>
                <Button variant="primaryWhite" px="3">
                  <Trans>Create Account</Trans>
                </Button>
              </Skeleton>
            </>
          ) : isLoggedIn() ? (
            <>
              <Button
                variant="primaryWhite"
                as={RouteLink}
                to="/"
                px="3"
                display={{ base: 'none', md: 'inline' }}
                onClick={signOut}
              >
                <Trans>Sign Out</Trans>
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="primaryWhite"
                as={RouteLink}
                to="/sign-in"
                px="3"
                mr="2"
                display={{ base: 'none', md: 'inline' }}
              >
                <Trans>Sign In</Trans>
              </Button>
              {window.env?.APP_IS_PRODUCTION === true && (
                <Button
                  className="create-account-button"
                  variant="primaryWhite"
                  as={RouteLink}
                  to="/create-user"
                  px="3"
                  display={{ base: 'none', md: 'inline' }}
                >
                  <Trans>Create Account</Trans>
                </Button>
              )}
            </>
          )}
        </Flex>
      </Flex>
    </Layout>
  )
}

TopBanner.propTypes = {
  initialLoading: bool,
}
