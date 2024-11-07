import React from 'react'
import { t } from '@lingui/macro'
import { Flex } from '@chakra-ui/react'
import { array } from 'prop-types'

import { SummaryCard } from './SummaryCard'

import theme from '../theme/canada'

export function SummaryGroup({ summaries }) {
  const { darkOrange: pass } = theme.colors.tracker.logo
  const { dark: fail } = theme.colors.tracker.cool
  const webCategoryDisplay = {
    fail: {
      name: t`Non-compliant`,
      color: fail,
    },
    pass: {
      name: t`Compliant`,
      color: pass,
    },
  }

  const mailcategoryDisplay = {
    fail: {
      name: t`Not Implemented`,
      color: fail,
    },
    pass: {
      name: t`Implemented`,
      color: pass,
    },
  }

  return (
    <Flex
      className="summaries-group"
      direction={{ base: 'column', md: 'row' }}
      justify="space-evenly"
      align="stretch"
      w="100%"
      mb={6}
    >
      {summaries.map(({ id, title, description, data }) => (
        <SummaryCard
          key={id}
          id={id}
          title={title}
          description={description}
          categoryDisplay={id === 'email' ? mailcategoryDisplay : webCategoryDisplay}
          data={data}
          mb={{ base: 6, md: 0 }}
        />
      ))}
    </Flex>
  )
}

SummaryGroup.propTypes = {
  summaries: array,
}
