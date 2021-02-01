import React from 'react'
import { Box, Icon, Stack, Text } from '@chakra-ui/core'
import { object, string } from 'prop-types'
import { Trans } from '@lingui/macro'

export function PolicyComplianceDetails({ categoryName, policies }) {
  const smallDevice = window.matchMedia('(max-width: 500px)').matches
  const infoIcon = <Icon name="info" color="#3f8cd9" />

  const httpsPolicy = (
    <Stack isInline align="center" px="2" pt={['2', '0']}>
      {!smallDevice && infoIcon}
      <Box>
        <Stack isInline align="center">
          {smallDevice && infoIcon}
          <Text fontWeight="bold">
            <Trans>Implementation Status:</Trans>
          </Text>
          <Text>{policies?.implementation}</Text>
        </Stack>
        <Stack isInline>
          <Text fontWeight="bold">
            <Trans>Level of Enforcment:</Trans>
          </Text>
          <Text>{policies?.enforced}</Text>
        </Stack>
        <Stack isInline>
          <Text fontWeight="bold">
            <Trans>HSTS Status:</Trans>
          </Text>
          <Text>{policies?.hsts}</Text>
        </Stack>
        {policies?.hstsAge && (
          <Stack isInline>
            <Text fontWeight="bold">
              <Trans>HSTS Age:</Trans>
            </Text>
            <Text>{policies?.hstsAge}</Text>
          </Stack>
        )}
        <Stack isInline>
          <Text fontWeight="bold">
            <Trans>Preloaded Status:</Trans>
          </Text>
          <Text>{policies?.preloaded}</Text>
        </Stack>
      </Box>
    </Stack>
  )

  const dmarcPolicy = (
    <Stack isInline align="center" px="2" pt={['2', '0']}>
      {!smallDevice && infoIcon}
      <Box>
        {policies?.dmarcPhase && (
          <Stack isInline align="center">
            {smallDevice && infoIcon}
            <Text fontWeight="bold">
              <Trans>Phase:</Trans>
            </Text>
            <Text>{policies?.dmarcPhase}</Text>
          </Stack>
        )}
        <Stack isInline>
          <Text fontWeight="bold">pPolicy:</Text>
          <Text>{policies?.pPolicy}</Text>
        </Stack>
        <Stack isInline>
          <Text fontWeight="bold">spPolicy:</Text>
          <Text>{policies?.spPolicy}</Text>
        </Stack>
        <Stack isInline>
          <Text fontWeight="bold">pct:</Text>
          <Text>{policies?.pct}</Text>
        </Stack>
      </Box>
    </Stack>
  )

  const spfPolicy = (
    <Stack isInline align="center" px="2" pt={['2', '0']}>
      {!smallDevice && infoIcon}
      <Box>
        <Stack isInline align="center">
          {smallDevice && infoIcon}
          <Text fontWeight="bold">lookups:</Text>
          <Text>{policies?.lookups}</Text>
        </Stack>
        <Stack isInline>
          <Text fontWeight="bold">spfDefault:</Text>
          <Text>{policies?.spfDefault}</Text>
        </Stack>
      </Box>
    </Stack>
  )

  if (categoryName === 'https') {
    return httpsPolicy
  } else if (categoryName === 'dmarc') {
    return dmarcPolicy
  } else {
    return spfPolicy
  }
}

PolicyComplianceDetails.propTypes = {
  categoryName: string,
  policies: object,
}
