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
      display={{ base: 'none', md: 'flex' }}
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
        >
          {React.Children.map(children, (child) => {
            if (child !== null) {
              return React.cloneElement(child, {
                as: ReactRouterLink,
              })
            }
          })}
        </Stack>
      </Flex>
    </Flex>
  )
}

Navigation.propTypes = {
  children: node,
}
