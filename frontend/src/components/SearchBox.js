import React from 'react'
import {
  Box,
  Divider,
  Flex,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Stack,
  Text,
} from '@chakra-ui/react'
import { Trans } from '@lingui/macro'
import { ArrowDownIcon, ArrowUpIcon, SearchIcon } from '@chakra-ui/icons'
import { RelayPaginationControls } from './RelayPaginationControls'
import { array, bool, element, func, number, string } from 'prop-types'
import { InfoButton } from './InfoPanel'

export function SearchBox({
  selectedDisplayLimit,
  setSelectedDisplayLimit,
  hasNextPage,
  hasPreviousPage,
  next,
  previous,
  isLoadingMore,
  orderDirection,
  setSearchTerm,
  setOrderField,
  setOrderDirection,
  resetToFirstPage,
  orderByOptions,
  placeholder,
  onToggle,
  searchTip,
  totalRecords,
  ...props
}) {
  const orderIconName = orderDirection === 'ASC' ? <ArrowUpIcon /> : <ArrowDownIcon />
  return (
    <Box {...props} bg="gray.100" p="2" mb="4" borderColor="gray.300" borderWidth="1px">
      <Flex direction={{ base: 'column', md: 'row' }} alignItems={{ base: 'stretch', md: 'center' }} mb={2}>
        <Flex direction="row" minW={{ base: '100%', md: '50%' }} alignItems="center" flexGrow={1}>
          <Text as="label" htmlFor="Search-for-field" fontSize="md" fontWeight="bold" textAlign="center" mr={2}>
            <Trans>Search: </Trans>
          </Text>
          <InputGroup flexGrow={1}>
            <InputLeftElement aria-hidden="true">
              <SearchIcon color="black" />
            </InputLeftElement>
            <Input
              id="Search-for-field"
              type="text"
              placeholder={placeholder}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                resetToFirstPage()
              }}
              aria-label="Search-for-field"
              borderColor="black"
            />
          </InputGroup>
        </Flex>
        {onToggle && <InfoButton bg="gray.50" onToggle={onToggle} className="glossary-button" />}
        <Stack isInline align="center" ml={{ md: '5%' }}>
          <Text as="label" htmlFor="Sort-by-field" fontSize="md" fontWeight="bold" textAlign="center">
            <Trans>Sort by: </Trans>
          </Text>
          <Select
            id="Sort-by-field"
            aria-label="Sort by field"
            w="fit-content"
            borderColor="black"
            size="md"
            onChange={(e) => {
              setOrderField(e.target.value)
              resetToFirstPage()
            }}
          >
            {orderByOptions.map(({ value, text }) => {
              return (
                <option key={value} value={value}>
                  {text}
                </option>
              )
            })}
          </Select>
          <IconButton
            aria-label="Toggle sort direction"
            icon={orderIconName}
            color="primary"
            bg="white"
            borderColor="black"
            borderWidth="1px"
            onClick={() => {
              const newOrderDirection = orderDirection === 'ASC' ? 'DESC' : 'ASC'
              setOrderDirection(newOrderDirection)
              resetToFirstPage()
            }}
            ml="auto"
          />
        </Stack>
      </Flex>
      {searchTip && (
        <Box backgroundColor="gray.200" padding={1} borderRadius="sm" fontSize="sm">
          {searchTip}
        </Box>
      )}
      <Divider borderBottomWidth="1px" borderBottomColor="black" />
      <RelayPaginationControls
        onlyPagination={false}
        selectedDisplayLimit={selectedDisplayLimit}
        setSelectedDisplayLimit={setSelectedDisplayLimit}
        displayLimitOptions={[5, 10, 20, 50, 100]}
        resetToFirstPage={resetToFirstPage}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
        next={next}
        previous={previous}
        isLoadingMore={isLoadingMore}
        totalRecords={totalRecords}
      />
    </Box>
  )
}

SearchBox.propTypes = {
  orderDirection: string,
  selectedDisplayLimit: number,
  setSelectedDisplayLimit: func,
  hasNextPage: bool,
  hasPreviousPage: bool,
  next: func,
  previous: func,
  isLoadingMore: bool,
  setSearchTerm: func,
  setOrderField: func,
  setOrderDirection: func,
  resetToFirstPage: func,
  orderByOptions: array,
  placeholder: string,
  inputAriaLabel: string,
  onToggle: func,
  searchTip: element,
  totalRecords: number,
}
