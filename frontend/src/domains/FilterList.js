import React from 'react'
import { CheckCircleIcon, InfoIcon, WarningIcon } from '@chakra-ui/icons'
import { Text } from '@chakra-ui/layout'
import { Tag, TagCloseButton, TagLabel, TagRightIcon } from '@chakra-ui/tag'
import { t } from '@lingui/macro'
import { array, func } from 'prop-types'

export function FilterList({ filters, setFilters, resetToFirstPage, filterTagOptions, guidanceTagOptions }) {
  const statuses = {
    HTTPS_STATUS: `HTTPS`,
    HSTS_STATUS: `HSTS`,
    CERTIFICATES_STATUS: `Certificates`,
    CIPHERS_STATUS: `Ciphers`,
    CURVES_STATUS: t`Curves`,
    PROTOCOLS_STATUS: t`Protocols`,
    SPF_STATUS: `SPF`,
    DKIM_STATUS: `DKIM`,
    DMARC_STATUS: `DMARC`,
  }

  const assetStateLabels = {
    APPROVED: t`Approved`,
    DEPENDENCY: t`Dependency`,
    MONITOR_ONLY: t`Monitor Only`,
    CANDIDATE: t`Candidate`,
    REQUIRES_INVESTIGATION: t`Requires Investigation`,
  }

  const displayTagFilterName = (options, value) => {
    const tag = options.find((tag) => tag.value === value)
    if (tag) {
      return tag.text
    } else {
      console.warn(`Unknown tag filter value: ${value}`)
      return value
    }
  }

  const tagBgColour = (filterValue) => {
    switch (filterValue) {
      case 'PASS':
        return 'strongMuted'
      case 'FAIL':
        return 'weakMuted'
      case 'INFO':
        return 'infoMuted'
      default:
        return 'gray.100'
    }
  }

  const displayTag = (filterCategory, filterValue) => {
    switch (filterCategory) {
      case 'TAGS':
        return <TagLabel>{displayTagFilterName(filterTagOptions, filterValue)}</TagLabel>
      case 'ASSET_STATE':
        return <TagLabel>{assetStateLabels[filterValue]}</TagLabel>
      case 'GUIDANCE_TAG':
        return (
          <>
            <TagLabel>{displayTagFilterName(guidanceTagOptions, filterValue)}</TagLabel>
            <TagRightIcon color={'weak'} as={WarningIcon} />
          </>
        )
      default:
        return (
          <>
            <TagLabel>{statuses[filterCategory]}</TagLabel>
            <TagRightIcon
              color={filterValue === 'PASS' ? 'strong' : filterValue === 'FAIL' ? 'weak' : 'info'}
              as={filterValue === 'PASS' ? CheckCircleIcon : filterValue === 'FAIL' ? WarningIcon : InfoIcon}
            />
          </>
        )
    }
  }

  return (
    <>
      {filters.map(({ filterCategory, comparison, filterValue }, idx) => {
        return (
          <Tag
            fontSize="lg"
            borderWidth="1px"
            borderColor="gray.300"
            key={idx}
            m="1"
            bg={filterCategory === 'GUIDANCE_TAG' ? 'weakMuted' : tagBgColour(filterValue)}
          >
            {comparison === 'NOT_EQUAL' && <Text mr="1">!</Text>}
            {displayTag(filterCategory, filterValue)}
            <TagCloseButton
              onClick={() => {
                setFilters(filters.filter((_, i) => i !== idx))
                resetToFirstPage()
              }}
            />
          </Tag>
        )
      })}
    </>
  )
}

FilterList.propTypes = {
  filters: array.isRequired,
  setFilters: func.isRequired,
  resetToFirstPage: func.isRequired,
  filterTagOptions: array.isRequired,
  guidanceTagOptions: array,
}
