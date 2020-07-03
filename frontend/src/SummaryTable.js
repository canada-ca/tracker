import React from 'react'
import styled from '@emotion/styled'
import { useTable, usePagination } from 'react-table'
import { array } from 'prop-types'
import {
  Box,
  Text,
  Button,
  Stack,
  Select,
  Input,
  Collapse,
  IconButton,
} from '@chakra-ui/core'
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

const columns = [
  {
    Header: 'Domain',
    accessor: 'host_domain',
  },
  {
    Header: 'HTTPS',
    accessor: 'https_result',
  },
  {
    Header: 'HSTS',
    accessor: 'hsts_result',
  },
  {
    Header: 'HSTS Prelaoded',
    accessor: 'preloaded_result',
  },
  {
    Header: 'SSL',
    accessor: 'ssl_result',
  },
  {
    Header: 'Protocols & Ciphers',
    accessor: 'protocol_cipher_result',
  },
  {
    Header: 'Certificate Use',
    accessor: 'cert_use_result',
  },
  {
    Header: 'SPF',
    accessor: 'spf_result',
  },
  {
    Header: 'DKIM',
    accessor: 'dkim_result',
  },
  {
    Header: 'DMARC',
    accessor: 'dmarc_result',
  },
]

function SummaryTable({ ...props }) {
  const { data } = props
  const [show, setShow] = React.useState(true)
  const handleShow = () => setShow(!show)

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
      <Button bg="gray.700" color="white" onClick={handleShow} width="100%">
        {show ? 'Close' : 'Open'}
      </Button>
      <Collapse isOpen={show}>
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
          <Stack
            isInline
            align="center"
            flexWrap="wrap"
            justify="space-between"
          >
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
                Page {pageIndex + 1} of {pageOptions.length}{' '}
              </Text>
            </Stack>
            <Stack spacing="1em" isInline align="center" flexWrap="wrap">
              <Text fontWeight="semibold">Go to page: </Text>
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
      </Collapse>
    </Box>
  )
}

SummaryTable.propTypes = {
  data: array.isRequired,
}

export default WithPseudoBox(SummaryTable)
