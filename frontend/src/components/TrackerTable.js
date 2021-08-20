import React from 'react'
import {
  useGlobalFilter,
  usePagination,
  useSortBy,
  useTable,
} from 'react-table'
import { any, array, bool, func, shape, string } from 'prop-types'
import {
  Box,
  Flex,
  IconButton,
  NumberInput,
  NumberInputField,
  Stack,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  chakra,
  Link,
} from '@chakra-ui/react'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronUpIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
} from '@chakra-ui/icons'
import { t, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'

import { ReactTableGlobalFilter } from './ReactTableGlobalFilter'

import { InfoButton } from '../components/InfoPanel'

export function TrackerTable({ ...props }) {
  const { i18n } = useLingui()
  const {
    data,
    columns,
    title,
    initialSort,
    infoPanel,
    infoState,
    changeInfoState,
    searchPlaceholder,
  } = props

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    preGlobalFilteredRows,
    setGlobalFilter,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state,
  } = useTable(
    {
      columns,
      data,
      initialState: {
        sortBy: initialSort,
        pageSize: 10,
        pageIndex: 0,
      },
    },
    useGlobalFilter,
    useSortBy,
    usePagination,
  )

  return (
    <Box>
      <Flex direction="row" my={2}>
        <ReactTableGlobalFilter
          title={title}
          preGlobalFilteredRows={preGlobalFilteredRows}
          globalFilter={state.globalFilter}
          setGlobalFilter={setGlobalFilter}
          placeholder={searchPlaceholder}
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
                  tabIndex="0"
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
          {page.map((row) => {
            prepareRow(row)
            return (
              <Tr key={row.getRowProps().key} {...row.getRowProps()}>
                {row.cells.map((cell) => (
                  <Td
                    key={cell.getCellProps().key}
                    {...cell.getCellProps()}
                    isNumeric={cell.column.isNumeric}
                  >
                    {cell.column.id === 'guidanceTag' ? (
                      cell?.value?.refLinks ? (
                        <Link
                          href={cell.value?.refLinks[0]?.refLink}
                          isExternal
                        >
                          {cell.value.guidance} <ExternalLinkIcon />
                        </Link>
                      ) : (
                        <Text>null</Text>
                      )
                    ) : (
                      cell.render('Cell')
                    )}
                  </Td>
                ))}
              </Tr>
            )
          })}
        </Tbody>
      </Table>

      <Box className="pagination" mt="0.25em">
        <Stack isInline align="center" flexWrap="wrap" justify="space-between">
          <Stack spacing="1em" isInline align="center" flexWrap="wrap">
            <IconButton
              onClick={() => {
                // wrapperRef.current.scrollIntoView()
                gotoPage(0)
              }}
              disabled={!canPreviousPage}
              icon={<ArrowLeftIcon />}
              aria-label="Go to first page"
            />
            <IconButton
              onClick={() => {
                // wrapperRef.current.scrollIntoView(true)
                previousPage()
              }}
              disabled={!canPreviousPage}
              icon={<ChevronLeftIcon />}
              aria-label="Go to previous page"
            />
            <IconButton
              onClick={() => {
                // wrapperRef.current.scrollIntoView(true)
                nextPage()
              }}
              disabled={!canNextPage}
              icon={<ChevronRightIcon />}
              aria-label="Go to next page"
            />
            <IconButton
              onClick={() => {
                // wrapperRef.current.scrollIntoView(true)
                gotoPage(pageCount - 1)
              }}
              disabled={!canNextPage}
              icon={<ArrowRightIcon />}
              aria-label="Go to last page"
            />
            <Stack isInline align="center" spacing="4px">
              <Box as="label" htmlFor={`${title.replace(/\s+/g, '-')}-goTo`}>
                <Trans>Go to page:</Trans>
              </Box>
              <NumberInput
                defaultValue={1}
                min={1}
                max={pageOptions.length}
                id={`${title.replace(/\s+/g, '-')}-goTo`}
                width="6rem"
                onChange={(event) => {
                  gotoPage(parseInt(event) - 1)
                }}
              >
                <NumberInputField aria-label="Go to input page" />
              </NumberInput>
            </Stack>
            <Text>
              <Trans>
                Page {state.pageIndex + 1} of {pageOptions.length}
              </Trans>
            </Text>
          </Stack>
          <Stack spacing="1em" isInline align="center" flexWrap="wrap">
            <Text
              as="label"
              htmlFor={`${title.replace(/\s+/g, '-')}-items-per-page`}
              fontSize="md"
              textAlign="center"
            >
              <Trans>Items per page: </Trans>
            </Text>
            <Select
              id={`${title.replace(/\s+/g, '-')}-items-per-page`}
              value={state.pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                // wrapperRef.current.scrollIntoView(true)
              }}
              width="fit-content"
              aria-label="Items per page"
            >
              {[5, 10, 20].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {i18n._(t`Show ${pageSize}`)}
                </option>
              ))}
            </Select>
          </Stack>
        </Stack>
      </Box>
    </Box>
  )
}

TrackerTable.propTypes = {
  data: array.isRequired,
  columns: array.isRequired,
  title: string,
  initialSort: array.isRequired,
  infoPanel: any,
  infoState: shape({
    isVisible: bool,
  }),
  changeInfoState: func,
  searchPlaceholder: string,
}
