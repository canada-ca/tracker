import React from 'react'
import {
  useGlobalFilter,
  useFilters,
  usePagination,
  useSortBy,
  useTable,
} from 'react-table'
import { any, array, bool, func, number, shape, string } from 'prop-types'
import {
  Box,
  Flex,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  chakra,
} from '@chakra-ui/react'
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons'
import WithWrapperBox from './WithWrapperBox'
import ReactTableGlobalFilter from './ReactTableGlobalFilter'
import { InfoButton } from './InfoPanel'

function TrackerTable({ ...props }) {
  const {
    data,
    columns,
    initialSort,
    selectedDisplayLimit = window.matchMedia('screen and (max-width: 760px)')
      .matches
      ? 5
      : 10,
    manualFilters,
    infoPanel,
    infoState,
    changeInfoState,
    searchPlaceholder,
  } = props

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    state,
    preGlobalFilteredRows,
    setGlobalFilter,
  } = useTable(
    {
      columns,
      data,
      initialState: {
        sortBy: initialSort,
        pageSize: selectedDisplayLimit,
      },
    },
    useGlobalFilter,
    useSortBy,
  )

  return (
    <Box>
      <Flex direction="row" my={2}>
        <ReactTableGlobalFilter
          preGlobalFilteredRows={preGlobalFilteredRows}
          globalFilter={state.globalFilter}
          setGlobalFilter={setGlobalFilter}
          placeholder={searchPlaceholder}
          my={1}
        />

        {infoState && (
          <InfoButton
            ml="auto"
            label="Glossary"
            state={infoState}
            changeState={changeInfoState}
          />
        )}
      </Flex>

      {infoPanel}

      <Table variant="med" {...getTableProps()}>
        <Thead>
          {headerGroups.map((headerGroup) => (
            <Tr
              key={headerGroup.getHeaderGroupProps().key}
              {...headerGroup.getHeaderGroupProps()}
            >
              {headerGroup.headers.map((column) => (
                <Th
                  key={column.getHeaderProps(column.getSortByToggleProps()).key}
                  {...column.getHeaderProps(column.getSortByToggleProps())}
                  isNumeric={column.isNumeric}
                >
                  {column.render('Header')}
                  <chakra.span>
                    {column.isSorted ? (
                      column.isSortedDesc ? (
                        <ChevronDownIcon aria-label="sorted descending" />
                      ) : (
                        <ChevronUpIcon aria-label="sorted ascending" />
                      )
                    ) : null}
                  </chakra.span>
                </Th>
              ))}
            </Tr>
          ))}
        </Thead>
        <Tbody {...getTableBodyProps()}>
          {rows.map((row) => {
            prepareRow(row)
            return (
              <Tr {...row.getRowProps()}>
                {row.cells.map((cell) => (
                  <Td
                    {...cell.getCellProps()}
                    isNumeric={cell.column.isNumeric}
                  >
                    {cell.render('Cell')}
                  </Td>
                ))}
              </Tr>
            )
          })}
        </Tbody>
      </Table>
    </Box>
  )
}

TrackerTable.propTypes = {
  data: array.isRequired,
  columns: array.isRequired,
  initialSort: array.isRequired,
  linkColumns: array,
  prependLink: string,
  appendLink: string,
  selectedDisplayLimit: number,
  manualFilters: bool,
  infoPanel: any,
  infoState: shape({
    isHidden: bool,
  }),
  changeInfoState: func,
  searchPlaceholder: string,
}

export default WithWrapperBox(TrackerTable)
