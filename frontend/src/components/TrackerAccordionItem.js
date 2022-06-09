import React from 'react'
import { any, node, string } from 'prop-types'
import {
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Button,
  Flex,
  Spacer,
} from '@chakra-ui/react'
import { Trans } from '@lingui/macro'

export const TrackerAccordionItem = ({
  buttonLabel,
  buttonVariant,
  children,
  panelProps,
  ...props
}) => {
  return (
    <AccordionItem {...props}>
      <Button as={AccordionButton} variant={buttonVariant} w="100%">
        <Flex alignItems="center" w="100%">
          <Spacer />
          <Trans>{buttonLabel}</Trans>
          <Spacer />
          <AccordionIcon mr={2} boxSize="icons.xl" />
        </Flex>
      </Button>
      <AccordionPanel {...panelProps}>{children}</AccordionPanel>
    </AccordionItem>
  )
}

TrackerAccordionItem.propTypes = {
  buttonLabel: string,
  buttonVariant: string,
  panelProps: any,
  children: node,
}

TrackerAccordionItem.defaultProps = {
  buttonVariant: 'primary',
}
