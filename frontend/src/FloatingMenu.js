import { FloatingMenuLink } from './FloatingMenuLink'
import React from 'react'
import { Link as RouteLink } from 'react-router-dom'
import {
  Box,
  Button,
  Divider,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Heading,
  Image,
  Link,
  Stack,
  useDisclosure,
  useToast,
} from '@chakra-ui/react'
import { t, Trans } from '@lingui/macro'
import wordmark from './images/canada-wordmark.svg'
import { useLingui } from '@lingui/react'
import { useUserVar } from './UserState'

export const FloatingMenu = () => {
  const { i18n } = useLingui()
  const { _currentUser, isLoggedIn, logout } = useUserVar()
  const toast = useToast()

  const {
    isOpen: drawerIsOpen,
    onOpen: drawerOnOpen,
    onClose: drawerOnClose,
  } = useDisclosure()
  const drawerBtnRef = React.useRef()

  const StyledDivider = (
    <Divider
      orientation="vertical"
      borderColor="accent"
      borderWidth="2px"
      height={{ base: '45px', sm: '64px' }}
      ml={0}
    />
  )

  return (
    <Box
      // position="fixed" as "sticky" doesn't play nice with firefox for android
      position="fixed"
      bottom="-1px" // this gets rid of a small gap in firefox for android
      zIndex={2}
      height="min-content"
      width="100%"
      bg="white"
      p="4px"
      display={{ base: 'static', md: 'none' }}
    >
      <Stack
        isInline
        width="100%"
        rounded="md"
        spacing={0}
        divider={StyledDivider}
      >
        <Link as={RouteLink} to="/organizations" flex="1 1 0">
          <Button
            variant="primary"
            rounded={0}
            m={0}
            w="100%"
            h="100%"
            fontSize={{ base: '60%', sm: '100%' }}
          >
            <Trans>Organizations</Trans>
          </Button>
        </Link>

        <Link as={RouteLink} to="/domains" flex="1 1 0">
          <Button
            variant="primary"
            rounded={0}
            m={0}
            w="100%"
            h="100%"
            fontSize={{ base: '60%', sm: '100%' }}
          >
            <Trans>Domains</Trans>
          </Button>
        </Link>

        <Link as={RouteLink} to="/dmarc-summaries" flex="1 1 0">
          <Button
            variant="primary"
            rounded={0}
            m={0}
            w="100%"
            h="100%"
            fontSize={{ base: '60%', sm: '100%' }}
            whiteSpace="normal"
            overflowWrap="break-word"
          >
            <Trans>DMARC Summaries</Trans>
          </Button>
        </Link>

        <Box flex="1 1 0">
          <Button
            variant="primary"
            ref={drawerBtnRef}
            onClick={drawerOnOpen}
            rounded={0}
            m={0}
            w="100%"
            h="100%"
            fontSize={{ base: '60%', sm: '100%' }}
          >
            <Trans>Menu</Trans>
          </Button>
        </Box>

        <Drawer
          isOpen={drawerIsOpen}
          placement="bottom"
          onClose={drawerOnClose}
          finalFocusRef={drawerBtnRef}
          blockScrollOnMount={false} // blocking scroll causes bad behaviour in firefox for android
        >
          <DrawerOverlay />
          <DrawerContent backgroundColor="primary" ml="auto" width="75%">
            <Stack spacing="0px" mt="auto">
              <DrawerHeader
                mt="auto"
                borderBottomWidth="1px"
                borderBottomColor="accent"
                mb="0px"
                px="24px"
                py="16px"
              >
                <Heading textAlign="right" color="white" size="xl" px="4px">
                  <Trans>Menu</Trans>
                </Heading>
              </DrawerHeader>

              <DrawerBody px="24px" py="16px">
                <Stack spacing="16px" align="end">
                  <FloatingMenuLink to="/" text={t`Home`} />

                  <FloatingMenuLink to="/user" text={t`Account Settings`} />

                  <FloatingMenuLink to="/admin" text={t`Admin Portal`} />

                  <Divider
                    borderWidth="2px"
                    borderColor="accent"
                    width="100%"
                    opacity="50%"
                    mt="0px"
                  />

                  {isLoggedIn() ? (
                    <FloatingMenuLink
                      to="/"
                      text={t`Sign Out`}
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
                    />
                  ) : (
                    <FloatingMenuLink to="/sign-in" text={t`Sign In`} />
                  )}

                  {!isLoggedIn() && (
                    <FloatingMenuLink
                      to="/create-user"
                      text={t`Create Account`}
                    />
                  )}

                  <Divider
                    borderWidth="2px"
                    borderColor="accent"
                    width="100%"
                    opacity="50%"
                    mt="0px"
                  />

                  <FloatingMenuLink
                    to={
                      i18n.locale === 'en'
                        ? 'https://www.canada.ca/en/transparency/privacy.html'
                        : 'https://www.canada.ca/fr/transparence/confidentialite.html'
                    }
                    text={t`Privacy`}
                    isExternal
                  />

                  <FloatingMenuLink
                    to="/terms-and-conditions"
                    text={t`Terms & conditions`}
                  />

                  <FloatingMenuLink
                    to={'https://github.com/canada-ca/tracker/issues'}
                    text={t`Report an Issue`}
                    isExternal
                  />
                </Stack>
              </DrawerBody>

              <DrawerFooter
                borderTopWidth="1px"
                borderTopColor="accent"
                backgroundColor="gray.300"
              >
                <Stack isInline width="100%" justify="space-between">
                  <Image
                    src={wordmark}
                    width="147.2px"
                    alt={
                      i18n.locale === 'en'
                        ? 'Symbol of the Government of Canada'
                        : 'Symbole du gouvernement du Canada'
                    }
                    color="white"
                  />
                  <Button
                    color="primary"
                    bg="transparent"
                    borderColor="primary"
                    borderWidth="1px"
                    onClick={drawerOnClose}
                  >
                    <Trans>Close</Trans>
                  </Button>
                </Stack>
              </DrawerFooter>
            </Stack>
          </DrawerContent>

          {
            // Firefox for android makes the menu bar disappear when exiting the menu if the address bar is hidden initially,
            // this brings the menu bar back
            setTimeout(() => window.scrollBy(0, -1), 1)
          }
        </Drawer>
      </Stack>
    </Box>
  )
}

FloatingMenu.propTypes = {}
