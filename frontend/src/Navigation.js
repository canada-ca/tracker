import React, { useRef } from 'react'
import { Link as RouteLink, Link as ReactRouterLink } from 'react-router-dom'
import {
  Flex,
  Stack,
  Menu,
  MenuButton,
  Button,
  MenuList,
  MenuItem,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  Box,
  Input,
  SimpleGrid,
  IconButton,
  Icon,
  Link,
  Divider,
  Image,
  Text,
} from '@chakra-ui/core'
import { node } from 'prop-types'
import { TrackerButton } from './TrackerButton'
import { Trans } from '@lingui/macro'
import wordmark from './images/canada-wordmark.svg'
import { useLingui } from '@lingui/react'

export const Navigation = ({ children, ...props }) => {
  // // This block grabs the sign in link so it can be used in the navbar or menu
  // const signInLink = () => {
  //   for (const child of children) {
  //     // There are some children which aren't links, next line deals with those
  //     const linkTo = (child.props || {}).to
  //
  //     if (linkTo === '/sign-in') {
  //       return child
  //     }
  //   }
  // }
  //
  // console.log(signInLink())

  const { i18n } = useLingui()

  const {
    isOpen: drawerIsOpen,
    onOpen: drawerOnOpen,
    onClose: drawerOnClose,
  } = useDisclosure()
  const drawerBtnRef = React.useRef()

  return (
    <Flex
      as="nav"
      align="center"
      justify="space-between"
      wrap="wrap"
      padding={{ sm: '0.6rem', md: '0.80rem', lg: '1rem', xl: '1rem' }}
      bg="#fff"
      py="4px"
      color="primary"
      borderBottom="2px solid"
      borderBottomColor="gray.300"
      position="sticky"
      bottom={0}
      zIndex={2}
      {...props}
    >
      <Flex
        maxW={{ sm: 540, md: 768, lg: 960, xl: 1200 }}
        mx="auto"
        px={4}
        w="100%"
        align="center"
        direction="row"
      >
        <Stack
          isInline
          alignItems="center"
          flexWrap="wrap"
          spacing="6"
          w="100%"
          display={{ base: 'none', md: 'flex' }}
        >
          {React.Children.map(children, (child) => {
            if (child !== null) {
              return React.cloneElement(child, {
                as: ReactRouterLink,
              })
            }
          })}
        </Stack>

        <Stack isInline width="100%" rounded="md" spacing={0}>
          <Link as={RouteLink} to="/user" flex="1 1 0">
            <TrackerButton variant="primary" rounded={0} w="100%" h="100%">
              <Icon name="person" />
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
              <Icon name="report" />
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
              <Icon name="building" />
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
            placement="right"
            onClose={drawerOnClose}
            finalFocusRef={drawerBtnRef}
          >
            <DrawerOverlay />
            <DrawerContent backgroundColor="primary">
              <DrawerCloseButton color="white" />
              <Stack mt="auto">
                <DrawerHeader
                  mt="auto"
                  borderBottomWidth="1px"
                  borderBottomColor="accent"
                >
                  <Text textAlign="right" color="white">
                    <Trans>Menu</Trans>
                  </Text>
                </DrawerHeader>

                <DrawerBody>
                  <Stack spacing="16px">
                    <Link as={RouteLink} to="/">
                      <Text
                        fontWeight="bold"
                        textAlign="right"
                        color="white"
                        fontSize="lg"
                      >
                        Home
                      </Text>
                    </Link>
                    <Link as={RouteLink} to="/admin">
                      <Text
                        fontWeight="bold"
                        textAlign="right"
                        color="white"
                        fontSize="lg"
                      >
                        Admin Portal
                      </Text>
                    </Link>
                    <Divider
                      borderWidth="2px"
                      borderColor="accent"
                      width="100%"
                      opacity="50%"
                    />
                    <Link
                      isExternal
                      href={
                        i18n.locale === 'en'
                          ? 'https://www.canada.ca/en/transparency/privacy.html'
                          : 'https://www.canada.ca/fr/transparence/confidentialite.html'
                      }
                    >
                      <Text
                        fontWeight="bold"
                        textAlign="right"
                        color="white"
                        fontSize="lg"
                      >
                        Privacy
                      </Text>
                    </Link>
                    <Link
                      isExternal
                      href={
                        i18n.locale === 'en'
                          ? 'https://www.canada.ca/en/transparency/terms.html'
                          : 'https://www.canada.ca/fr/transparence/avis.html'
                      }
                    >
                      <Text
                        fontWeight="bold"
                        textAlign="right"
                        color="white"
                        fontSize="lg"
                      >
                        Terms & Conditions
                      </Text>
                    </Link>
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
          </Drawer>
        </Stack>
      </Flex>
    </Flex>
  )
}

Navigation.propTypes = {
  children: node,
}
