import React from 'react'
import {
  Button,
  Link,
  Text,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  UnorderedList,
  ListItem,
} from '@chakra-ui/react'
import { Trans } from '@lingui/macro'

export function GettingStarted() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const btnRef = React.useRef()
  return (
    <>
      <Button ref={btnRef} variant="primary" onClick={onOpen}>
        Get Started
      </Button>
      <Drawer
        isOpen={isOpen}
        placement="right"
        onClose={onClose}
        finalFocusRef={btnRef}
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Getting Started Using Tracker</DrawerHeader>

          <DrawerBody>
            <Text fontWeight="bold">
              <Trans>Getting an Account:</Trans>
            </Text>
            <UnorderedList mb="2">
              <ListItem>
                <Text>
                  <Trans>Lorem ipsum</Trans>
                </Text>
              </ListItem>
            </UnorderedList>
            <Text fontWeight="bold">
              <Trans>Understanding Scan Metrics:</Trans>
            </Text>
            <UnorderedList mb="2">
              <ListItem>
                <Text>
                  <Trans>Lorem ipsum</Trans>
                </Text>
              </ListItem>
            </UnorderedList>
            <Text fontWeight="bold">
              <Trans>Managing Your Domains:</Trans>
            </Text>
            <UnorderedList mb="2">
              <ListItem>
                <Text>
                  <Trans>Lorem ipsum</Trans>
                </Text>
              </ListItem>
            </UnorderedList>
            <Text fontWeight="bold">
              <Trans>References:</Trans>
            </Text>
            <UnorderedList mb="2">
              <ListItem>
                <Link>
                  <Trans>Lorem ipsum</Trans>
                </Link>
              </ListItem>
            </UnorderedList>
          </DrawerBody>

          <DrawerFooter></DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  )
}
