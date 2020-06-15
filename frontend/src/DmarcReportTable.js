import React from 'react'
import styled from '@emotion/styled'
import { useTable, usePagination, useSortBy } from 'react-table'
import { array, string } from 'prop-types'
import {
  Box,
  Button,
  ButtonGroup,
  Collapse,
  Divider,
  Icon,
  IconButton,
  Input, Select,
  Stack,
  Text,
} from '@chakra-ui/core'

import WithPseudoBox from './withPseudoBox'

const Table = styled.table`
width: calc(100% - 2px);
border-collapse: collapse;
border: 1px solid #ccc;

caption {
  width: 100%;
}

th {
  color: black;
  font-weight: bold;
}

td, th {
  padding: 6px;
  border: 1px solid #ccc;
  text-align: left;
}

.pagination {
  padding: 0.5rem;
}

// Remove outside borders from cells, let table handle border
@media screen and (min-width: 761px) {
  tr:first-child td {
    border-top: 0;
  }
  tr td:first-child, th:first-child {
    border-left: 0;
  }
  tr:last-child td {
    border-bottom: 0;
  }
  tr td:last-child, th:last-child {
    border-right: 0;
  }
}

@media screen and (max-width: 760px) {
  table,
  thead,
  tbody,
  th,
  td,
  tr {
    display: block;
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
    props.flatHeaders.slice(1).map((headerObj, index) => {
      return `
        td:nth-of-type(${index + 1}):before {
          content: '${headerObj.Header}';
          font-weight: bold;
        }
      `
    })}
`

function DmarcReportTable({ ...props }) {
  const { data, columns, title, initialSort } = props
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
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    flatHeaders,
    state: { pageIndex, pageSize },
  } = useTable(
    {
      columns,
      data,
      initialState: {
        sortBy: initialSort,
        pageSize: defaultPageSize,
      },
    },
    useSortBy,
    usePagination,
  )

  return (
    <Box>
      <Button bg="gray.700" color="white" onClick={handleShow} width="100%">
        {title}
      </Button>
      <Collapse isOpen={show}>
        <Box width="100%" overflowX="auto">
          <Table {...getTableProps()} flatHeaders={flatHeaders}>
            <thead>
              {headerGroups.map((headerGroup, index) => {
                return (
                  <tr key={index} {...headerGroup.getHeaderGroupProps()}>
                    {headerGroup.headers.map((column) => {
                      // Using column.Header since column.id _sometimes_ has appended numbers
                      const key =
                        column.depth === 0
                          ? `${title}:${column.Header}`
                          : `${column.parent.Header}:${column.Header}`
                      return (
                        <th
                          key={key}
                          className={column.hidden ? 'visually-hidden' : ''}
                          {...column.getHeaderProps(
                            column.getSortByToggleProps(),
                          )}
                        >
                          {column.render('Header')}
                          <span>
                            {column.isSorted ? (
                              column.isSortedDesc ? (
                                <Icon name="chevron-down" />
                              ) : (
                                <Icon name="chevron-up" />
                              )
                            ) : (
                              ''
                            )}
                          </span>
                        </th>
                      )
                    })}
                  </tr>
                )
              })}
            </thead>
            <tbody {...getTableBodyProps()}>
              {page.map((row, rowIndex) => {
                prepareRow(row)
                return (
                  <tr key={`${title}:${rowIndex}`} {...row.getRowProps()}>
                    {row.cells.map((cell, cellIndex) => {
                      return (
                        <td
                          key={`${title}:${rowIndex}:${cellIndex}`}
                          {...cell.getCellProps()}
                        >
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
        <Box className="pagination" hidden={!show}>
          <Stack spacing="1em" isInline align="center">
            <ButtonGroup spacing="1em">
              <IconButton
                onClick={() => gotoPage(0)}
                disabled={!canPreviousPage}
                icon="arrow-left"
              />
              <IconButton
                onClick={() => previousPage()}
                disabled={!canPreviousPage}
                icon="chevron-left"
              />
              <IconButton
                onClick={() => nextPage()}
                disabled={!canNextPage}
                icon="chevron-right"
              />
              <IconButton
                onClick={() => gotoPage(pageCount - 1)}
                disabled={!canNextPage}
                icon="arrow-right"
              />
            </ButtonGroup>
            <Text>
              Page {pageIndex + 1} of {pageOptions.length}
            </Text>
            <Divider
              orientation="vertical"
              borderColor="black"
              bg="black"
              height="1rem"
            />
            <Text>Go to page:</Text>
            <Input
              defaultValue={pageIndex + 1}
              width="6rem"
              onChange={(e) => {
                const page = e.target.value ? Number(e.target.value) - 1 : 0
                gotoPage(page)
              }}
            />
            <Select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
              }}
              width="fit-content"
            >
              {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  Show {pageSize}
                </option>
              ))}
            </Select>
          </Stack>
        </Box>
      </Collapse>
    </Box>
  )
}

DmarcReportTable.propTypes = {
  data: array.isRequired,
  columns: array.isRequired,
  title: string.isRequired,
  initialSort: array,
}

export default WithPseudoBox(DmarcReportTable)
