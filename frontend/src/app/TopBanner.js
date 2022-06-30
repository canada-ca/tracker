import React from 'react'
import { t, Trans } from '@lingui/macro'
import { Box, Button, Flex, useToast, Image, Link } from '@chakra-ui/react'
import { Link as RouteLink } from 'react-router-dom'
import { useMutation } from '@apollo/client'

import sigEn from '../images/goc-header-logo-dark-en.svg'
import sigFr from '../images/goc-header-logo-dark-fr.svg'
import trackerLogoOrange from '../images/Frame.svg'
import trackerText from '../images/Asset3.svg'

import { LocaleSwitcher } from './LocaleSwitcher'

import { Layout } from '../components/Layout'
import { useUserVar } from '../utilities/userState'
import { SIGN_OUT } from '../graphql/mutations'
import { PhaseBanner } from './PhaseBanner'
import { useLingui } from '@lingui/react'

export const TopBanner = (props) => {
  const { isLoggedIn, logout } = useUserVar()
  const toast = useToast()
  const { i18n } = useLingui()

  const [signOut] = useMutation(SIGN_OUT, {
    onError(error) {
      toast({
        title: error.message,
        description: t`An error occured when you attempted to sign out`,
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
      <Flex align="center" fontFamily="body" {...props}>
        <Box
          ml="8"
          mr="4"
          width={{ base: 272, md: 360 }}
          display={{ base: 'none', md: 'initial' }}
        >
          <Image
            src={i18n.locale === 'en' ? sigEn : sigFr}
            pr="auto"
            py="6"
            minHeight="41px"
            alt={t`Symbol of the Government of Canada`}
          />
        </Box>
        <Link as={RouteLink} to="/">
          <Flex align="center">
            <Box
              my="4"
              ml="4"
              width={{ base: 0, md: 125 }}
              display={{ base: 'none', md: 'initial' }}
            >
              <Image src={trackerLogoOrange} alt={t`Tracker logo outline`} />
            </Box>
            <Box
              mr="4"
              my="4"
              width={{ base: 0, md: 125 }}
              display={{ base: 'none', md: 'initial' }}
            >
              <Image src={trackerText} alt={t`Tracker logo text`} />
            </Box>
          </Flex>
        </Link>

        <PhaseBanner
          phase={<Trans>BETA</Trans>}
          ml={{ base: '0', md: 'auto' }}
          mr="2"
        >
          <Trans>This is a new service, we are constantly improving.</Trans>
        </PhaseBanner>

        <Box py="4" mx="2" ml={{ base: 'auto', md: '0' }}>
          <LocaleSwitcher />
        </Box>

        {isLoggedIn() ? (
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
            <Button
              variant="primaryWhite"
              as={RouteLink}
              to="/create-user"
              px="3"
              display={{ base: 'none', md: 'inline' }}
            >
              <Trans>Create Account</Trans>
            </Button>
          </>
        )}
      </Flex>
    </Layout>
  )
}
