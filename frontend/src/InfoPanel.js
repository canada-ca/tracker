import React from 'react'
import { any, bool, func, shape, string } from 'prop-types'
import { Trans } from '@lingui/macro'
import { Box, Button, Collapse, Stack } from '@chakra-ui/react'

export function InfoPanel({ state, children }) {
  return (
    <Collapse in={state.isVisible}>
      <Box border="2px" borderColor="gray.400" rounded="md" p="1em" my="1em">
        <Stack direction="column">{children}</Stack>
      </Box>
    </Collapse>
  )
}

export function InfoBox({ title, info }) {
  return (
    <Box my="0.25em">
      <Trans fontWeight="bold">{title}</Trans>
      <span>: </span>
      <Trans>{info}</Trans>
    </Box>
  )
}

export function InfoButton({ state, changeState, label, ...props }) {
  return (
    <Button
      variant="info"
      display="inline-block"
      type="button"
      onClick={() => {
        changeState({
          ...state,
          isVisible: !state.isVisible,
        })
      }}
      {...props}
    >
      <Trans> {label} </Trans>
    </Button>
  )
}

InfoPanel.propTypes = {
  state: shape({
    isVisible: bool,
  }),
  children: any,
}

InfoBox.propTypes = {
  title: string,
  info: string,
}

InfoButton.propTypes = {
  state: shape({
    isVisible: bool,
  }),
  changeState: func,
  label: string,
}
