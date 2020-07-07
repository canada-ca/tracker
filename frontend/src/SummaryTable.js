import React from 'react'
import styled from '@emotion/styled'
import { useTable, usePagination } from 'react-table'
import { array } from 'prop-types'
import { t, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Box, Text, Stack, Select, Input, IconButton } from '@chakra-ui/core'
import WithPseudoBox from './withPseudoBox'

const Table = styled.table`
  & {
    width: 100%;
    border-collapse: collapse;
  }

  th {
    color: black;
    font-weight: bold;
  }

  td, th {
    padding: 6px;
    border: 1px solid #ccc;
    text-align: center;
  }

  .pagination {
    padding: 0.5rem;
  }

  .title {
    text-align: center;
  }

  @media only screen and (max-width: 760px) {
    table,
    thead,
    tbody,
    th,
    td,
    tr {
      display: block;
    }

    thead .category {
      position: absolute;
      top: -9999px;
      left: -9999px;
    }

    tr { border: 1px solid #ccc; }

    td {
      border: none;
      border-bottom: 1px solid #ccc;
      position: relative;
      padding-left: 50%;
    }

    td: before {
      position: absolute;
      top: 6px;
      left: 6px;
      width: 45%;
      padding-right: 10px;
      white-space: nowrap;
    }

    ${(props) =>
      props.flatHeaders.map((headerObj, index) => {
        return `
          td:nth-of-type(${index + 1}):before {
            content: '${headerObj.Header}';
            font-weight: bold;
          }
        `
      })}
`

function SummaryTable({ ...props }) {
  const { data, columns } = props
  const { i18n } = useLingui()
  const defaultPageSize = window.matchMedia('screen and (max-width: 760px)')
    .matches
    ? 5
    : 10

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    flatHeaders,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
  } = useTable(
    {
      columns,
      data,
      initialState: { pageIndex: 0, pageSize: defaultPageSize },
    },
    usePagination,
  )

  return (
    <Box>
      <Box width="100%" overflowX="auto">
        <Table {...getTableProps()} flatHeaders={flatHeaders}>
          <thead>
            {headerGroups.map((headerGroup, idx) => (
              <tr
                key={String(headerGroup) + idx}
                className="category"
                {...headerGroup.getHeaderGroupProps()}
              >
                {headerGroup.headers.map((column, i) => (
                  <th key={String(column) + i} {...column.getHeaderProps()}>
                    {column.render('Header')}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()}>
            {page.map((row, idx) => {
              prepareRow(row)
              return (
                <tr key={String(row) + idx} {...row.getRowProps()}>
                  {row.cells.map((cell, i) => {
                    return (
                      <td key={String(cell) + i} {...cell.getCellProps()}>
                        {cell.render('Cell')}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </Table>
      </Box>
      <Box className="pagination">
        <Stack isInline align="center" flexWrap="wrap" justify="space-between">
          <Stack spacing="1em" isInline align="center" flexWrap="wrap">
            <IconButton
              icon="arrow-left"
              onClick={() => gotoPage(0)}
              disabled={!canPreviousPage}
            />
            <IconButton
              icon="chevron-left"
              onClick={() => previousPage()}
              disabled={!canPreviousPage}
            />
            <IconButton
              icon="chevron-right"
              onClick={() => nextPage()}
              disabled={!canNextPage}
            />
            <IconButton
              icon="arrow-right"
              onClick={() => gotoPage(pageCount - 1)}
              disabled={!canNextPage}
            />
            <Text fontWeight="semibold">
              <Trans>Page</Trans> {pageIndex + 1} <Trans>of</Trans>{' '}
              {pageOptions.length}{' '}
            </Text>
          </Stack>
          <Stack spacing="1em" isInline align="center" flexWrap="wrap">
            <Text fontWeight="semibold">
              <Trans>Go to page: </Trans>
            </Text>
            <Input
              variant="outline"
              width="60px"
              type="number"
              onChange={(e) => {
                const page = e.target.value ? Number(e.target.value) - 1 : 0
                gotoPage(page)
              }}
            />{' '}
            <Select
              w="30"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
              }}
            >
              {[5, 10, 20].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  Show {pageSize}
                </option>
              ))}
            </Select>
          </Stack>
        </Stack>
      </Box>
    </Box>
  )
}

SummaryTable.propTypes = {
  data: array.isRequired,
  columns: array.isRequired,
}

export default WithPseudoBox(SummaryTable)
