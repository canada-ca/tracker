import React from 'react'
import { LocaleSwitcher } from './LocaleSwitcher'
import { useLingui } from '@lingui/react'
import { useUserState } from './UserState'
import { Trans, t } from '@lingui/macro'
import sigEn from './images/goc-header-logo-en.svg'
import sigFr from './images/goc-header-logo-fr.svg'
import { Flex, Box, Image, useToast } from '@chakra-ui/core'
import { Layout } from './Layout'
import { TrackerButton } from './TrackerButton'
import { Link as RouteLink } from 'react-router-dom'

export const TopBanner = (props) => {
  const { i18n } = useLingui()
  const { isLoggedIn, logout } = useUserState()
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

          <Box ml='auto'/>

          {isLoggedIn() ? (
           <TrackerButton
            as={RouteLink}
            to="/"
            variant="primary hover"
            mx={1}
            px={{base:1, md:3}}
            fontSize={{ base: 'xs', md: 'md' }}
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
           </TrackerButton>
         ) : (
           <TrackerButton
             as={RouteLink}
             variant="primary white"
             to="/sign-in"
             mx={1}
             px={{base:1, md:3}}
             fontSize={{ base: 'xs', md: 'md' }}
           >
             <Trans>Sign In</Trans>
           </TrackerButton>
         )}

         {!isLoggedIn() && (
           <TrackerButton
             as={RouteLink}
             variant="primary hover"
             to="/create-user"
             mx={1}
             px={{base:1, md:3}}
             fontSize={{ base: 'xs', md: 'md' }}
           >
             <Trans>Create Account</Trans>
           </TrackerButton>
         )}

         <Box py={4}>
           <LocaleSwitcher />
         </Box>
        </Flex>
      </Layout>
    </Flex>
  );
}
