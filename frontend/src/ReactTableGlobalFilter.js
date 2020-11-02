import React from 'react'
import { useAsyncDebounce } from 'react-table'
import WithPseudoBox from './withPseudoBox'
import { any } from 'prop-types'
import {
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Stack,
  Text,
} from '@chakra-ui/core'
import { t, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'

const ReactTableGlobalFilter = ({
  preGlobalFilteredRows,
  globalFilter,
  setGlobalFilter,
}) => {
  const { i18n } = useLingui()
  const count = preGlobalFilteredRows.length
  const [value, setValue] = React.useState(globalFilter)
  const onChange = useAsyncDebounce((value) => {
    setGlobalFilter(value || undefined)
  }, 200)

  return (
    <Stack isInline align="center">
      <Text fontWeight="bold">
        <Trans>Search:</Trans>
      </Text>

      <InputGroup w={{ sm: '100%', md: '20rem' }}>
        <InputLeftElement>
          <Icon name="search" />
        </InputLeftElement>
        <Input
          value={value || ''}
          onChange={(e) => {
            setValue(e.target.value)
            onChange(e.target.value)
          }}
          placeholder={t`${count} records...`}
        />
      </InputGroup>
    </Stack>
  );
}

ReactTableGlobalFilter.propTypes = {
  // TODO: Add accurate prop types for these
  preGlobalFilteredRows: any,
  globalFilter: any,
  setGlobalFilter: any,
}

export default WithPseudoBox(ReactTableGlobalFilter)
