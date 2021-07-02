import React from 'react'
import { any, bool, func, shape, string } from 'prop-types'
import { Trans } from '@lingui/macro'
import { Box, Stack } from '@chakra-ui/core'
import { TrackerButton } from './TrackerButton'


export function InfoPanel({
  state,
  children,
}) {

  return(
    <Box
      hidden={state.isHidden}
      border="2px"
      borderColor="gray.400"
      rounded="md"
      p='1em'
      my='1em'
    >
      <Stack
        direction='column'
      >
        {children}
      </Stack>
    </Box>
  )
}

export function InfoBox({
  title,
  info,
}) {
  return (
    <Box my='0.25em'>
      <strong><Trans>{title}</Trans></strong>
      <span>: </span>
      <Trans>{info}</Trans>
    </Box>
  )
}

export function InfoButton({
  state,
  changeState,
  label,
}) {
  return (
    <TrackerButton
      variant="info"
      display="inline-block"
      onClick={() => {
        changeState({
          ...state,
          isHidden: !state.isHidden,
        })
    }}>
      <Trans> {label} </Trans>
    </TrackerButton>
  )
}


InfoPanel.propTypes = {
  state: shape({
    isHidden: bool,
  }),
  children: any,
}

InfoBox.propTypes = {
  title: string,
  info: string,
}

InfoButton.propTypes = {
  state: shape({
    isHidden: bool,
  }),
  changeState: func,
  label: string,
}
