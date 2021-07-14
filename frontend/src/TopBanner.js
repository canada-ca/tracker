import React from 'react'
import { LocaleSwitcher } from './LocaleSwitcher'
import { useLingui } from '@lingui/react'
import { useUserVar } from './UserState'
import { t, Trans } from '@lingui/macro'
import sigEn from './images/goc-header-logo-en.svg'
import sigFr from './images/goc-header-logo-fr.svg'
import { Box, Button, Flex, Image, useToast } from '@chakra-ui/react'
import { Layout } from './Layout'
import { Link as RouteLink } from 'react-router-dom'

export const TopBanner = (props) => {
  const { i18n } = useLingui()
  const { isLoggedIn, logout } = useUserVar()
  const toast = useToast()

  return (
    <Flex bg="primary" borderBottom="3px solid" borderBottomColor="accent">
      <Layout>
        <Flex
          maxW={{ sm: 540, md: 768, lg: 960, xl: 1200 }}
          mx="auto"
          w="100%"
          align="center"
          fontFamily="body"
          {...props}
        >
          <Box py="4" width={{ base: 272, md: 360 }}>
            <Image
              src={i18n.locale === 'en' ? sigEn : sigFr}
              pr={16}
              py={2}
              minHeight="41px"
              alt={'Symbol of the Government of Canada'}
            />
          </Box>

          <Box ml="auto" />

          {isLoggedIn() ? (
            <Button
              variant="primaryHover"
              as={RouteLink}
              to="/"
              mx={1}
              px={3}
              display={{ base: 'none', md: 'inline' }}
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
            >
              <Trans>Sign Out</Trans>
            </Button>
          ) : (
            <Button
              variant="primaryWhite"
              as={RouteLink}
              to="/sign-in"
              mx={1}
              px={3}
              display={{ base: 'none', md: 'inline' }}
            >
              <Trans>Sign In</Trans>
            </Button>
          )}

          {!isLoggedIn() && (
            <Button
              variant="primaryHover"
              as={RouteLink}
              to="/create-user"
              mx={1}
              px={3}
              display={{ base: 'none', md: 'inline' }}
            >
              <Trans>Create Account</Trans>
            </Button>
          )}

          <Box py={4}>
            <LocaleSwitcher />
          </Box>
        </Flex>
      </Layout>
    </Flex>
  )
}
