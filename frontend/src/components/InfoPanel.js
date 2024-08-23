import React from 'react'
import { any, bool, func, string } from 'prop-types'
import { t, Trans } from '@lingui/macro'
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

export function InfoPanel({ title = t`Glossary`, isOpen, onToggle, children }) {
  const btnRef = React.useRef()
  return (
    <Drawer isOpen={isOpen} placement="bottom" onClose={onToggle} finalFocusRef={btnRef}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>{title}</DrawerHeader>

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
      variant="primaryOutline"
      mx="2"
      onClick={onToggle}
    />
  )
}

InfoPanel.propTypes = {
  title: string,
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
