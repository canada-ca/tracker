import React from 'react'
import { any, bool, func, string } from 'prop-types'
import { Trans } from '@lingui/macro'
import { Box, IconButton, Slide, Stack, Text } from '@chakra-ui/react'
import { ArrowDownIcon, ArrowUpIcon } from '@chakra-ui/icons'

export function InfoPanel({ isOpen, onToggle, children }) {
  return (
    <Slide in={isOpen} direction="bottom" style={{ zIndex: 2 }}>
      <Box
        bg="white"
        border="2px"
        borderColor="gray.400"
        rounded="md"
        p="1em"
        px="8"
        py="8"
      >
        <InfoButton isOpen={isOpen} onToggle={onToggle} left="50%" />
        <Stack direction="column">{children}</Stack>
      </Box>
    </Slide>
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

export function InfoButton({ isOpen, onToggle, ...props }) {
  return (
    <IconButton
      icon={
        isOpen ? (
          <ArrowDownIcon boxSize="1.5rem" />
        ) : (
          <ArrowUpIcon boxSize="1.5rem" />
        )
      }
      aria-label={isOpen ? 'Close glossary' : 'Open glossary'}
      onClick={onToggle}
      color="black"
      bg="white"
      borderColor="black"
      borderWidth="2px"
      isRound
      my="2"
      {...props}
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
  isOpen: bool,
  onToggle: func,
}
