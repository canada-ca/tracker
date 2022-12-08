import React from 'react'
import { NumberedStatusIcon } from '../components/NumberedStatusIcon'
import { Flex, Text } from '@chakra-ui/react'
import { number, string } from 'prop-types'
import { Trans } from '@lingui/macro'

export function GuidanceSummaryCategories({
  passCount,
  infoCount,
  failCount,
  mr,
}) {
  const summaryCategoryStyleProps = {
    py: '1',
    px: '2',
    align: 'center',
    borderWidth: '2px',
    bg: 'gray.100',
    borderColor: 'gray.300',
    rounded: 'md',
  }
  return (
    <>
      <Flex {...summaryCategoryStyleProps} ml="auto">
        <NumberedStatusIcon number={passCount} status="FAIL" />
        <Text px="1" fontWeight="bold" color="weak">
          <Trans>Negative</Trans>
        </Text>
      </Flex>
      <Flex {...summaryCategoryStyleProps} mx="1">
        <NumberedStatusIcon number={infoCount} status="INFO" />
        <Text px="1" fontWeight="bold" color="info">
          <Trans>Informative</Trans>
        </Text>
      </Flex>
      <Flex {...summaryCategoryStyleProps} mr={mr}>
        <NumberedStatusIcon number={failCount} status="PASS" />
        <Text px="1" fontWeight="bold" color="strong">
          <Trans>Positive</Trans>
        </Text>
      </Flex>
    </>
  )
}

GuidanceSummaryCategories.propTypes = {
  passCount: number,
  infoCount: number,
  failCount: number,
  mr: string,
}
