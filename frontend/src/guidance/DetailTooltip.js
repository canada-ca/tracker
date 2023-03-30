import { Flex, Tooltip } from '@chakra-ui/react'
import { InfoOutlineIcon } from '@chakra-ui/icons'
import React from 'react'
import { node, string } from 'prop-types'

export const DetailTooltip = ({ children, label, ...props }) => {
  return (
    <Flex align="center" minW="50%" {...props}>
      <Tooltip
        hasArrow
        label={label}
        fontSize="1em"
        borderWidth="1px"
        borderSytle="solid"
        borderColor="info"
        arrowShadowColor="info"
      >
        <Flex align="center">
          {children}
          <InfoOutlineIcon ml="1" color="info" size="icons.sm" aria-label="More info" />
        </Flex>
      </Tooltip>
    </Flex>
  )
}

DetailTooltip.propTypes = {
  label: string,
  children: node,
}
