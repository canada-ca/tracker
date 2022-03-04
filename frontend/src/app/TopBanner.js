import React from 'react'
// import { useLingui } from '@lingui/react'
import { t, Trans } from '@lingui/macro'
import { Box, Button, Flex, useToast } from '@chakra-ui/react'
import { Link as RouteLink } from 'react-router-dom'
import { useMutation } from '@apollo/client'

import { LocaleSwitcher } from './LocaleSwitcher'

import { Layout } from '../components/Layout'
import { useUserVar } from '../utilities/userState'
// import sigEn from '../images/goc-header-logo-en.svg'
// import sigFr from '../images/goc-header-logo-fr.svg'
import { SIGN_OUT } from '../graphql/mutations'
import { PhaseBanner } from './PhaseBanner'

export const TopBanner = (props) => {
  // const { i18n } = useLingui()
  const { isLoggedIn, logout } = useUserVar()
  const toast = useToast()

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
        {/* <Box py="4" width={{ base: 272, md: 360 }}>
          <Image
            src={i18n.locale === 'en' ? sigEn : sigFr}
            pr={16}
            py={2}
            minHeight="41px"
            alt={'Symbol of the Government of Canada'}
          />
        </Box> */}

        <PhaseBanner phase={<Trans>BETA</Trans>} ml="auto" mr="2">
          <Trans>This is a new service, we are constantly improving.</Trans>
        </PhaseBanner>

        <Box py="4" mx="2">
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
