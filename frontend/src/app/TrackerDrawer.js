import React, { useRef } from 'react'
import {
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Box,
  IconButton,
  useDisclosure,
} from '@chakra-ui/react'
import { ArrowBackIcon, ArrowForwardIcon } from '@chakra-ui/icons'

export function TrackerDrawer({ ...props }) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const btnRef = useRef()
  return (
    <>
      <IconButton
        {...props}
        ref={btnRef}
        aria-label="tracker-drawer"
        icon={isOpen ? <ArrowBackIcon /> : <ArrowForwardIcon />}
        isRound
        onClick={isOpen ? onClose : onOpen}
        color="white"
        bgColor="primary"
        borderWidth="2px"
        borderColor="white"
        ml={isOpen ? '17.5%' : '0'}
      />
      <Drawer
        isOpen={isOpen}
        placement="left"
        finalFocusRef={btnRef}
        isFullHeight
        // trapFocus={false}
      >
        <DrawerContent>
          <DrawerHeader>Header</DrawerHeader>

          <DrawerBody>Body</DrawerBody>

          <DrawerFooter>Footer</DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  )
}
