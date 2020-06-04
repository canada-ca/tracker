/* eslint-disable react/jsx-key */
import React from 'react'
import styled from '@emotion/styled'
import { useTable, usePagination } from 'react-table'
import { array } from 'prop-types'
import { Box, Text, Button, Stack, Select, Input } from '@chakra-ui/core'

import WithPseudoBox from './withPseudoBox'

const Table = styled.table`
width: 100%;
border-collapse: collapse;

th {
color: black;
font-weight: bold;
}

td, th {
padding: 6px;
border: 1px solid #ccc;
text-align: left;
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
      initialState: { pageIndex: 0 },
    },
    usePagination,
  )

  return (
    <Stack align="center">
      <Box overflowX="auto">
        <Text fontWeight="bold" fontSize="3xl" textAlign={['center']}>
          Domain Summary Table
        </Text>
        <br />
        <Table {...getTableProps()} flatHeaders={flatHeaders}>
          <thead>
            {headerGroups.map((headerGroup) => (
              <tr className="category" {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((column) => (
                  <th {...column.getHeaderProps()}>
                    {column.render('Header')}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()}>
            {page.map((row, i) => {
              prepareRow(row)
              return (
                <tr {...row.getRowProps()}>
                  {row.cells.map((cell) => {
                    return (
                      <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </Table>
      </Box>
      <Stack className="pagination" isInline>
        <Button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
          {'<<'}
        </Button>{' '}
        <Button onClick={() => previousPage()} disabled={!canPreviousPage}>
          {'<'}
        </Button>{' '}
        <Button onClick={() => nextPage()} disabled={!canNextPage}>
          {'>'}
        </Button>{' '}
        <Button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
          {'>>'}
        </Button>{' '}
        <Text fontWeight="semibold">
          Page {pageIndex + 1} of {pageOptions.length}{' '}
        </Text>
        <Text>| Go to page: </Text>
        <Input
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
          {[10, 20, 30, 40, 50].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </Select>
      </Stack>
    </Stack>
  )
}

SummaryTable.propTypes = {
  data: array.isRequired,
  columns: array.isRequired,
}

export default WithPseudoBox(SummaryTable)
