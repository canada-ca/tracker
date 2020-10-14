import { FloatingMenuLink } from './FloatingMenuLink'
import React from 'react'
import { Link as RouteLink } from 'react-router-dom'
import {
  Stack,
  Button,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  useDisclosure,
  Box,
  Link,
  Divider,
  Image,
  useToast,
  Heading,
} from '@chakra-ui/core'
import { TrackerButton } from './TrackerButton'
import { Trans, t } from '@lingui/macro'
import wordmark from './images/canada-wordmark.svg'
import { useLingui } from '@lingui/react'
import { useUserState } from './UserState'

export const FloatingMenu = () => {
  const { i18n } = useLingui()
  const { _currentUser, isLoggedIn, logout } = useUserState()
  const toast = useToast()

  const {
    isOpen: drawerIsOpen,
    onOpen: drawerOnOpen,
    onClose: drawerOnClose,
  } = useDisclosure()
  const drawerBtnRef = React.useRef()

  return (
    <Box
      // position="fixed" as "sticky" doesn't play nice with firefox for android
      position="fixed"
      bottom={-1} // this gets rid of a small gap in firefox for android
      zIndex={2}
      height="min-content"
      width="100%"
      bg="white"
      p="4px"
      display={{ base: 'static', md: 'none' }}
    >
      <Stack isInline width="100%" rounded="md" spacing={0}>
        <Link as={RouteLink} to="/user" flex="1 1 0">
          <TrackerButton variant="primary" rounded={0} w="100%" h="100%">
            <Image src="/src/images/person-icon.svg" height="16px" />
          </TrackerButton>
        </Link>
        <Divider
          orientation="vertical"
          borderColor="accent"
          borderWidth="2px"
          ml={0}
        />
        <Link as={RouteLink} to="/dmarc-summaries" flex="1 1 0">
          <TrackerButton variant="primary" rounded={0} w="100%" h="100%">
            <Image src="/src/images/report-icon.svg" size="16px" />
          </TrackerButton>
        </Link>
        <Divider
          orientation="vertical"
          borderColor="accent"
          borderWidth="2px"
          ml={0}
        />
        <Link as={RouteLink} to="/organizations" flex="1 1 0">
          <TrackerButton variant="primary" rounded={0} w="100%" h="100%">
            <Image src="/src/images/building-icon.svg" size="16px" />
          </TrackerButton>
        </Link>
        <Divider
          orientation="vertical"
          borderColor="accent"
          borderWidth="2px"
          ml={0}
        />

        <Box flex="1 1 0">
          <TrackerButton
            ref={drawerBtnRef}
            variant="primary"
            onClick={drawerOnOpen}
            rounded={0}
            w="100%"
            h="100%"
          >
            <Trans>Menu</Trans>
          </TrackerButton>
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
                <Stack spacing="16px">
                  <FloatingMenuLink to="/" text={i18n._(t`Home`)} />

                  <FloatingMenuLink
                    to="/admin"
                    text={i18n._(t`Admin Portal`)}
                  />

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
                      text={i18n._(t`Sign Out`)}
                      onClick={() => {
                        logout()
                        toast({
                          title: i18n._(t`Sign Out.`),
                          description: i18n._(
                            t`You have successfully been signed out.`,
                          ),
                          status: 'success',
                          duration: 9000,
                          isClosable: true,
                          position: 'top-left',
                        })
                      }}
                    />
                  ) : (
                    <FloatingMenuLink to="/sign-in" text={i18n._(t`Sign In`)} />
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
                    text={i18n._(t`Privacy`)}
                    isExternal
                  />

                  <FloatingMenuLink
                    to={
                      i18n.locale === 'en'
                        ? 'https://www.canada.ca/en/transparency/terms.html'
                        : 'https://www.canada.ca/fr/transparence/avis.html'
                    }
                    text={i18n._(t`Terms & conditions`)}
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
