import React from 'react'
import { Link, Text } from '@chakra-ui/react'
import { Link as RouteLink } from 'react-router-dom'
import { bool, string } from 'prop-types'

export const FloatingMenuLink = ({ to, text, isExternal, ...props }) => {
  // isExternal will change the type of element required (external vs react-router link)
  let linkType
  if (isExternal) {
    linkType = Link
  } else {
    linkType = RouteLink
  }

  return (
    <Link
      as={linkType}
      to={to}
      href={to}
      ml="auto"
      isExternal={isExternal}
      _active={{ bg: 'accent' }}
      _focus={{ outline: 'none' }}
      {...props}
    >
      <Text fontWeight="bold" color="white" fontSize="lg">
        {text}
      </Text>
    </Link>
  )
}

FloatingMenuLink.propTypes = {
  to: string.isRequired,
  text: string.isRequired,
  isExternal: bool,
}
