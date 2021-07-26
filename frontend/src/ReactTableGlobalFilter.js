import React from 'react'
import { useAsyncDebounce } from 'react-table'
import WithWrapperBox from './WithWrapperBox'
import { any, string } from 'prop-types'
import {
  Input,
  InputGroup,
  InputLeftElement,
  Stack,
  Text,
} from '@chakra-ui/react'
import { SearchIcon } from '@chakra-ui/icons'
import { t, Trans } from '@lingui/macro'

const ReactTableGlobalFilter = ({
  title,
  preGlobalFilteredRows,
  globalFilter,
  setGlobalFilter,
  placeholder,
}) => {
  const count = preGlobalFilteredRows.length
  const [value, setValue] = React.useState(globalFilter)
  const onChange = useAsyncDebounce((value) => {
    setGlobalFilter(value || undefined)
  }, 200)

  return (
    <Stack isInline align="center">
      <Text
        as="label"
        htmlFor={`${title.replace(/\s+/g, '-')}-search-field`}
        fontWeight="bold"
      >
        <Trans>Search:</Trans>
      </Text>

      <InputGroup w={{ sm: '100%', md: '20rem' }}>
        <InputLeftElement aria-hidden="true">
          <SearchIcon />
        </InputLeftElement>
        <Input
          id={`${title.replace(/\s+/g, '-')}-search-field`}
          value={value || ''}
          onChange={(e) => {
            setValue(e.target.value)
            onChange(e.target.value)
          }}
          placeholder={placeholder || t`${count} records...`}
          aria-label="Filter the table"
        />
      </InputGroup>
    </Stack>
  )
}

ReactTableGlobalFilter.propTypes = {
  // TODO: Add accurate prop types for these
  title: string,
  preGlobalFilteredRows: any,
  globalFilter: any,
  setGlobalFilter: any,
  placeholder: string,
}

export default WithWrapperBox(ReactTableGlobalFilter)
