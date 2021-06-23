import React from 'react'
import { PseudoBox, Spinner, Stack } from '@chakra-ui/core'
import { any, bool, string } from 'prop-types'

export const TrackerButton = React.forwardRef(
  ({ variant, isLoading, children, ...props }, ref) => {
    let color = 'black'
    let bg = 'gray.100'
    const hoverOb = { bg: 'gray.200' }
    let borderColor = null
    let borderWidth = null

    if (variant === 'primary') {
      color = 'gray.50'
      bg = 'primary'
      hoverOb.bg = 'primary2'
    } else if (variant === 'primary outline') {
      color = 'primary'
      bg = 'transparent'
      borderColor = 'primary'
      borderWidth = '1px'
    } else if (variant === 'primary hover') {
      color = 'gray.50'
      bg = 'primary'
      borderColor = 'gray.50'
      borderWidth = '1px'
      hoverOb.bg = 'primary'
      hoverOb.borderColor = 'accent'
      hoverOb.color = 'accent'
    } else if (variant === 'primary white') {
      color = 'primary'
      bg = 'gray.50'
      borderColor = 'gray.50'
      borderWidth = '1px'
      hoverOb.bg = 'accent'
      hoverOb.borderColor = 'accent'
      hoverOb.color = 'primary'
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
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
        fontWeight="semibold"
        rounded="md"
        transition="all 0.2s cubic-bezier(.08,.52,.52,1)"
        overflow="hidden"
        px="4"
        py="2"
        color={color}
        bg={bg}
        _hover={!isLoading && hoverOb}
        _active={{
          boxShadow: 'outline',
        }}
        _focus={{
          boxShadow: 'outline',
        }}
        _disabled={{ opacity: '0.4', cursor: 'not-allowed', boxShadow: 'none' }}
        disabled={isLoading}
        borderColor={borderColor}
        borderWidth={borderWidth}
        ref={ref}
        {...props}
      >
        {isLoading && (
          <Stack
            align="center"
            justifyContent="center"
            position="absolute"
            fontSize="1em"
            lineHeight="normal"
          >
            <Spinner />
          </Stack>
        )}

        <Stack
          isInline
          align="center"
          justifyContent="center"
          opacity={isLoading ? 0 : 100}
        >
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
  isLoading: bool,
}
