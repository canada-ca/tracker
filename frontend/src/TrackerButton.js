import React from 'react'
import { PseudoBox, Stack } from '@chakra-ui/core'
import { string, any } from 'prop-types'

export const TrackerButton = React.forwardRef(
  // ({ variant, children, ref, ...props }) => {
  ({ variant, children, ...props }, ref) => {
    let color = 'black'
    let bg = 'gray.100'
    let hoverColor = 'gray.200'
    let borderColor = null
    let borderWidth = null

    if (variant === 'primary') {
      color = 'gray.50'
      bg = 'primary'
      hoverColor = 'primary2'
    } else if (variant === 'outline') {
      color = 'primary2'
      bg = 'transparent'
      borderColor = 'primary2'
      borderWidth = '1px'
      hoverColor = 'blue.50'
    } else if (variant === 'danger') {
      color = 'gray.50'
      bg = 'red.700'
      hoverColor = 'red.600'
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
        ref={ref}
        {...props}
      >
        <Stack isInline align="center" justifyContent="center">
          {children}
        </Stack>
      </PseudoBox>
    )
  },
)

TrackerButton.propTypes = {
  variant: string,
  children: any,
}
