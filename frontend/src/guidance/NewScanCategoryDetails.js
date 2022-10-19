import React from 'react'
import PropTypes from 'prop-types'
import { Accordion, Box, Divider, Stack, Text } from '@chakra-ui/react'
import { t, Trans } from '@lingui/macro'

import { GuidanceTagList } from './GuidanceTagList'

import { TrackerAccordionItem as AccordionItem } from '../components/TrackerAccordionItem'

export function ScanDetails({ title, children }) {
  return <AccordionItem buttonLabel={title}>{children}</AccordionItem>
}

ScanDetails.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node,
}
