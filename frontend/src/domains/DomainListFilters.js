import { Box, Button, Flex, Select, Text } from '@chakra-ui/react'
import { Trans } from '@lingui/macro'
import { Formik } from 'formik'
import React from 'react'
import { getRequirement, schemaToValidation } from '../utilities/fieldRequirements'
import { array, func } from 'prop-types'

export function DomainListFilters({
  filters,
  setFilters,
  resetToFirstPage,
  statusOptions,
  filterTagOptions,
  assetStateOptions = [],
  ...props
}) {
  const validationSchema = schemaToValidation({
    filterCategory: getRequirement('field'),
    comparison: getRequirement('field'),
    filterValue: getRequirement('field'),
  })

  const filterValues = (values) => {
    if (values.filterCategory === 'TAGS') {
      return filterTagOptions.map(({ value, text }, idx) => {
        return (
          <option key={idx} value={value}>
            {text}
          </option>
        )
      })
    } else if (values.filterCategory === 'ASSET_STATE') {
      return assetStateOptions.map(({ value, text }, idx) => {
        return (
          <option key={idx} value={value}>
            {text}
          </option>
        )
      })
    } else {
      return (
        <>
          <option value="PASS">
            <Trans>Pass</Trans>
          </option>
          <option value="INFO">
            <Trans>Info</Trans>
          </option>
          <option value="FAIL">
            <Trans>Fail</Trans>
          </option>
        </>
      )
    }
  }

  return (
    <Box py="2" {...props}>
      <Formik
        validationSchema={validationSchema}
        initialValues={{
          filterCategory: '',
          comparison: '',
          filterValue: '',
        }}
        onSubmit={(values, { resetForm }) => {
          setFilters([
            ...new Map(
              [...filters, values].map((item) => {
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
                <Box maxW="25%" mr="1">
                  <Select
                    aria-label="filterCategory"
                    name="filterCategory"
                    borderColor="black"
                    onChange={(e) => {
                      if (values.filterCategory !== e.target.value) values.filterValue = ''
                      handleChange(e)
                    }}
                  >
                    <option hidden value="">
                      <Trans>Value</Trans>
                    </option>
                    {statusOptions.map(({ value, text }, idx) => {
                      return (
                        <option key={idx} value={value}>
                          {text}
                        </option>
                      )
                    })}
                    <option value="TAGS">
                      <Trans>Tag</Trans>
                    </option>
                    {assetStateOptions.length > 0 && (
                      <option value="ASSET_STATE">
                        <Trans>Asset State</Trans>
                      </option>
                    )}
                  </Select>
                  <Text color="red.500" mt={0}>
                    {errors.filterCategory}
                  </Text>
                </Box>
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
                  <Text color="red.500" mt={0}>
                    {errors.comparison}
                  </Text>
                </Box>
                <Box maxW="25%" mx="1">
                  <Select aria-label="filterValue" name="filterValue" borderColor="black" onChange={handleChange}>
                    <option hidden value="">
                      <Trans>Status/Tag/State</Trans>
                    </option>
                    {filterValues(values)}
                    {values.filterCategory === 'TAGS' && (
                      <option value="CVE_DETECTED">
                        <Trans>SPIN Top 25</Trans>
                      </option>
                    )}
                  </Select>
                  <Text color="red.500" mt={0}>
                    {errors.filterValue}
                  </Text>
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
}
