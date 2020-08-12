import React from 'react'
import { PseudoBox } from '@chakra-ui/core'
import { string } from 'prop-types'

export function TrackerButton({ variant, size, ...props }) {
  let color = 'black'
  let bg = 'gray.100'
  let borderColor = null
  let borderWidth = null
  let hoverColor = 'gray.200'

  if (variant === 'primary') {
    color = 'gray.50'
    bg = 'blue.900'
    hoverColor = 'blue.600'
  } else if (variant === 'outline') {
    color = 'blue.900'
    bg = 'transparent'
    borderColor = 'blue.900'
    borderWidth = '1px'
    hoverColor = 'blue.50'
  } else if (variant === 'danger') {
    color = 'gray.50'
    bg = 'red.600'
    hoverColor = 'red.700'
  }

  if (size === 'sm') {
    console.log()
  } else if (size === 'md') {
    console.log()
  } else if (size === 'lg') {
    console.log()
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
    />
  )
}

TrackerButton.propTypes = {
  variant: string,
  size: string,
}
