import React from 'react'
import { any, bool, func, string } from 'prop-types'
import { Trans } from '@lingui/macro'
import {
  Box,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  IconButton,
  Stack,
  Text,
} from '@chakra-ui/react'
import { QuestionOutlineIcon } from '@chakra-ui/icons'

export function InfoPanel({ isOpen, onToggle, children }) {
  const btnRef = React.useRef()
  return (
    <Drawer
      isOpen={isOpen}
      placement="bottom"
      onClose={onToggle}
      finalFocusRef={btnRef}
    >
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>
          <Trans>Glossary</Trans>
        </DrawerHeader>

        <DrawerBody>
          <Stack direction="column">{children}</Stack>
        </DrawerBody>

        <DrawerFooter></DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

export function InfoBox({ title, info }) {
  return (
    <Box my={1}>
      <Text as="span" fontWeight="bold">
        <Trans>{title}</Trans>
      </Text>
      <span>: </span>
      <Trans>{info}</Trans>
    </Box>
  )
}

export function InfoButton({ onToggle, ...props }) {
  return (
    <IconButton
      {...props}
      icon={<QuestionOutlineIcon />}
      aria-label="Open glossary"
      color="primary"
      bg="white"
      mx="2"
      onClick={onToggle}
    />
  )
}

InfoPanel.propTypes = {
  isOpen: bool,
  onToggle: func,
  children: any,
}

InfoBox.propTypes = {
  title: string,
  info: string,
}

InfoButton.propTypes = {
  onToggle: func,
}
