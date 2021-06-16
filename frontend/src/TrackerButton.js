import React from 'react'
import { PseudoBox, Stack } from '@chakra-ui/core'
import { string, any } from 'prop-types'

export const TrackerButton = React.forwardRef(
  ({ variant, children, ...props }, ref) => {
    let color = 'black'
    let bg = 'gray.100'
    const hoverOb = {bg: 'gray.200'}
    let borderColor = null
    let borderWidth = null

    if (variant === 'primary') {
      color = 'gray.50'
      bg = 'primary'
      hoverOb.bg = 'primary2'
    } else if (variant === 'primary outline') {
      color="primary"
      bg="transparent"
      borderColor="primary"
      borderWidth="1px"
    } else if (variant === 'outline') {
      color = 'primary2'
      bg = 'transparent'
      borderColor = 'primary2'
      borderWidth = '1px'
      hoverOb.bg = 'blue.50'
    } else if (variant === 'danger') {
      color = 'gray.50'
      bg = 'red.700'
      hoverOb.bg = 'red.600'
    } else if (variant === 'strong') {
      color = 'white'
      bg = 'strong'
      hoverOb.bg = 'green.400'
    } else if (variant === 'info') {
      color = 'white'
      bg = 'info'
      hoverOb.bg = 'blue.300'
    } else if (variant === 'weak') {
      color = 'white'
      bg = 'weak'
      hoverOb.bg = 'red.400'
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
        _hover={hoverOb}
        _active={{
          boxShadow: 'outline',
        }}
        _focus={{
          boxShadow: 'outline',
        }}
        _disabled={{ opacity: 0.6 }}
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

TrackerButton.displayName = 'TrackerButton'

TrackerButton.propTypes = {
  variant: string,
  children: any,
}
