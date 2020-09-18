import React from 'react'
import { PseudoBox, Stack } from '@chakra-ui/core'
import { string, any } from 'prop-types'

export function TrackerButton({ variant, children, ...props }) {
  let color = 'black'
  let bg = 'gray.100'
  let hoverColor = 'gray.200'
  let borderColor = null
  let borderWidth = null

  if (variant === 'primary') {
    color = 'gray.50'
    bg = 'primary'
    hoverColor = 'gray.600'
  } else if (variant === 'outline') {
    color = 'primary'
    bg = 'transparent'
    borderColor = 'primary'
    borderWidth = '1px'
    hoverColor = 'blue.50'
  } else if (variant === 'danger') {
    color = 'gray.50'
    bg = 'red.600'
    hoverColor = 'red.700'
  }

  return (
    <PseudoBox
      as="button"
      fontWeight="semibold"
      rounded="md"
      transition="all 0.2s cubic-bezier(.08,.52,.52,1)"
      overflow="hidden"
      px="4"
      py="2"
      color={color}
      bg={bg}
      _hover={{ bg: hoverColor }}
      _active={{
        boxShadow: 'outline',
      }}
      _focus={{
        outline: 'none',
      }}
      borderColor={borderColor}
      borderWidth={borderWidth}
      {...props}
    >
      <Stack isInline align="center" justifyContent="center">
        {children}
      </Stack>
    </PseudoBox>
  )
}

TrackerButton.propTypes = {
  variant: string,
  children: any,
}
