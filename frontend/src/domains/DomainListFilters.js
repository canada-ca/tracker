import React from 'react'
import { Box, Button, Flex, Select, Text } from '@chakra-ui/react'
import { t, Trans } from '@lingui/macro'
import { Formik } from 'formik'
import { getRequirement, schemaToValidation } from '../utilities/fieldRequirements'
import { array, func } from 'prop-types'

export function DomainListFilters({
  filters,
  setFilters,
  resetToFirstPage,
  statusOptions,
  filterTagOptions,
  assetStateOptions = [],
  guidanceTagOptions = [],
  ...props
}) {
  const validationSchema = schemaToValidation({
    filterCategory: getRequirement('field'),
    comparison: getRequirement('field'),
    filterValue: getRequirement('field'),
    statusOption: getRequirement('statusOption'),
  })

  const mapOptions = (options) => {
    return options.map(({ value, text }, idx) => {
      return (
        <option key={idx} value={value}>
          {text}
        </option>
      )
    })
  }

  const filterValues = (values) => {
    switch (values.filterCategory) {
      case 'STATUS':
        return mapOptions([
          { value: 'PASS', text: t`Pass` },
          { value: 'INFO', text: t`Info` },
          { value: 'FAIL', text: t`Fail` },
        ])
      case 'TAGS':
        return mapOptions(filterTagOptions.toSorted((a, b) => a.text.localeCompare(b.text)) || [])
      case 'ASSET_STATE':
        return mapOptions(assetStateOptions)
      case 'GUIDANCE_TAG':
        return mapOptions(guidanceTagOptions.toSorted((a, b) => a.text.localeCompare(b.text)) || [])
      case 'DMARC_PHASE':
        return mapOptions([
          { value: 'ASSESS', text: t`Assess` },
          { value: 'DEPLOY', text: t`Deploy` },
          { value: 'ENFORCE', text: t`Enforce` },
          { value: 'MAINTAIN', text: t`Maintain` },
        ])
      default:
        return []
    }
  }

  return (
    <Box py="2" {...props}>
      <Formik
        validationSchema={validationSchema}
        initialValues={{
          filterCategory: 'STATUS',
          comparison: '',
          filterValue: '',
          statusOption: '',
        }}
        onSubmit={(values, { resetForm }) => {
          const { statusOption, ...rest } = values
          // If filtering by status, use statusOption as filterCategory
          if (values.filterCategory === 'STATUS') {
            rest.filterCategory = statusOption
          }
          setFilters([
            ...new Map(
              [...filters, rest].map((item) => {
                if (item['filterCategory'] !== 'TAGS') return [item['filterCategory'], item]
                else return [item['filterValue'], item]
              }),
            ).values(),
          ])
          resetToFirstPage()
          resetForm()
        }}
      >
        {({ handleChange, handleSubmit, values, errors }) => {
          return (
            <form onSubmit={handleSubmit} role="form" aria-label="form" name="form">
              <Flex align="center">
                <Flex mr="1">
                  <Box>
                    <Select
                      borderColor="black"
                      name="filterCategory"
                      aria-label="filterCategory"
                      value={values.filterCategory}
                      onChange={(e) => {
                        if (values.filterCategory !== e.target.value) {
                          values.filterValue = ''
                          values.statusOption = ''
                        }
                        handleChange(e)
                      }}
                    >
                      <option value="STATUS">
                        <Trans>Status</Trans>
                      </option>
                      <option value="TAGS">
                        <Trans>Tag</Trans>
                      </option>
                      {assetStateOptions.length > 0 && (
                        <option value="ASSET_STATE">
                          <Trans>Asset State</Trans>
                        </option>
                      )}
                      <option value="DMARC_PHASE">
                        <Trans>DMARC Phase</Trans>
                      </option>
                      {guidanceTagOptions.length > 0 && (
                        <option value="GUIDANCE_TAG">
                          <Trans>Negative Finding</Trans>
                        </option>
                      )}
                    </Select>
                    <Text color="red.500">{errors.filterCategory}</Text>
                  </Box>

                  {values.filterCategory === 'STATUS' && (
                    <Box ml="2">
                      <Select
                        aria-label="statusOption"
                        name="statusOption"
                        borderColor="black"
                        value={values.statusOption}
                        onChange={handleChange}
                      >
                        <option hidden value="">
                          <Trans>Status Value</Trans>
                        </option>
                        {mapOptions(statusOptions)}
                      </Select>
                      <Text color="red.500">{errors.statusOption}</Text>
                    </Box>
                  )}
                </Flex>

                <Box maxW="25%" mx="1">
                  <Select aria-label="comparison" name="comparison" borderColor="black" onChange={handleChange}>
                    <option hidden value="">
                      <Trans>Comparison</Trans>
                    </option>
                    <option value="EQUAL">
                      <Trans>EQUALS</Trans>
                    </option>
                    <option value="NOT_EQUAL">
                      <Trans>DOES NOT EQUAL</Trans>
                    </option>
                  </Select>
                  <Text color="red.500">{errors.comparison}</Text>
                </Box>

                <Box maxW="25%" mx="1">
                  <Select aria-label="filterValue" name="filterValue" borderColor="black" onChange={handleChange}>
                    <option hidden value="">
                      <Trans>Value</Trans>
                    </option>
                    {filterValues(values)}
                  </Select>
                  <Text color="red.500">{errors.filterValue}</Text>
                </Box>

                <Button ml="auto" variant="primary" type="submit">
                  <Trans>Apply</Trans>
                </Button>
              </Flex>
            </form>
          )
        }}
      </Formik>
    </Box>
  )
}

DomainListFilters.propTypes = {
  filters: array,
  setFilters: func,
  resetToFirstPage: func,
  statusOptions: array,
  filterTagOptions: array,
  assetStateOptions: array,
  guidanceTagOptions: array,
}
