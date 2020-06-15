import React from 'react'
import styled from '@emotion/styled'
import { useTable, usePagination, useSortBy } from 'react-table'
import { array, string } from 'prop-types'
import { Box, Button, Collapse, Icon } from '@chakra-ui/core'

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

.pagination {
  padding: 0.5rem;
}

.visually-hidden {
    position: absolute !important;
    height: 1px;
    width: 1px;
    overflow: hidden;
    clip: rect(1px 1px 1px 1px); /* IE6, IE7 */
    clip: rect(1px, 1px, 1px, 1px);
    white-space: nowrap; /* added line */
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
          <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
            {'<<'}
          </button>{' '}
          <button onClick={() => previousPage()} disabled={!canPreviousPage}>
            {'<'}
          </button>{' '}
          <button onClick={() => nextPage()} disabled={!canNextPage}>
            {'>'}
          </button>{' '}
          <button
            onClick={() => gotoPage(pageCount - 1)}
            disabled={!canNextPage}
          >
            {'>>'}
          </button>{' '}
          <span>
            Page{' '}
            <strong>
              {pageIndex + 1} of {pageOptions.length}
            </strong>{' '}
          </span>
          <span>
            | Go to page:{' '}
            <input
              type="number"
              defaultValue={pageIndex + 1}
              onChange={(e) => {
                const page = e.target.value ? Number(e.target.value) - 1 : 0
                gotoPage(page)
              }}
              style={{ width: '100px' }}
            />
          </span>{' '}
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
            }}
          >
            {[5, 10, 20, 30, 40, 50].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                Show {pageSize}
              </option>
            ))}
          </select>
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
