import React from 'react'
import { CheckCircleIcon, InfoIcon, WarningIcon } from '@chakra-ui/icons'
import { Text } from '@chakra-ui/layout'
import { Tag, TagCloseButton, TagLabel, TagRightIcon } from '@chakra-ui/tag'
import { t } from '@lingui/macro'
import { array, func } from 'prop-types'

export function FilterList({ filters, setFilters }) {
  return (
    <>
      {filters.map(({ filterCategory, comparison, filterValue }, idx) => {
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
        return (
          <Tag
            fontSize="lg"
            borderWidth="1px"
            borderColor="gray.300"
            key={idx}
            m="1"
            bg={
              filterValue === 'PASS'
                ? 'strongMuted'
                : filterValue === 'FAIL'
                ? 'weakMuted'
                : filterValue === 'INFO'
                ? 'infoMuted'
                : 'gray.100'
            }
          >
            {comparison === 'NOT_EQUAL' && <Text mr="1">!</Text>}
            {filterCategory === 'TAGS' ? (
              <TagLabel>{filterValue}</TagLabel>
            ) : (
              <>
                <TagLabel>{statuses[filterCategory]}</TagLabel>
                <TagRightIcon
                  color={filterValue === 'PASS' ? 'strong' : filterValue === 'FAIL' ? 'weak' : 'info'}
                  as={filterValue === 'PASS' ? CheckCircleIcon : filterValue === 'FAIL' ? WarningIcon : InfoIcon}
                />
              </>
            )}

            <TagCloseButton onClick={() => setFilters(filters.filter((_, i) => i !== idx))} />
          </Tag>
        )
      })}
    </>
  )
}

FilterList.propTypes = {
  filters: array.isRequired,
  setFilters: func.isRequired,
}
