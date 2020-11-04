import React, { useRef, useState } from 'react'
import styled from '@emotion/styled'
import {
  useTable,
  usePagination,
  useSortBy,
  useFilters,
  useGlobalFilter,
} from 'react-table'
import { array, bool, string } from 'prop-types'
import {
  Box,
  Button,
  Collapse,
  Icon,
  IconButton,
  Input,
  Link,
  Select,
  Stack,
  Text,
} from '@chakra-ui/core'
import { Link as RouteLink } from 'react-router-dom'
import { t, Trans } from '@lingui/macro'
import WithPseudoBox from './withPseudoBox'
import { slugify } from './slugify'
import ReactTableGlobalFilter from './ReactTableGlobalFilter'

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

.visually-hidden {
  position: absolute !important;
  height: 1px;
  width: 1px;
  overflow: hidden;
  clip: rect(1px 1px 1px 1px); /* IE6, IE7 */
  clip: rect(1px, 1px, 1px, 1px);
  white-space: nowrap; /* added line */
}

// Remove outside borders from cells, let table handle border
@media screen and (min-width: 761px) {
  tr:first-type-of td {
    border-top: 0;
  }
  tr td:first-type-of, th:first-type-of {
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
  const {
    data,
    columns,
    title,
    initialSort,
    hideTitleButton,
    linkColumns,
    prependLink,
    appendLink,
  } = props
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
    preGlobalFilteredRows,
    setGlobalFilter,
    state,
  } = useTable(
    {
      columns,
      data,
      initialState: {
        sortBy: initialSort,
        pageSize: defaultPageSize,
      },
    },
    useFilters,
    useGlobalFilter,
    useSortBy,
    usePagination,
  )

  const [goToPageValue, setGoToPageNumber] = useState(pageIndex + 1)

  const handleGoToPageChange = (event) => {
    if (isNaN(event.target.value)) return 0 // TODO: Error handling here?
    setGoToPageNumber(event.target.value)

    const page = event.target.value ? Number(event.target.value) - 1 : 0
    gotoPage(page)
  }

  const wrapperRef = useRef(null)

  const titleButtonElement = !hideTitleButton ? (
    <Button bg="primary" color="white" onClick={handleShow} width="100%">
      {title}
    </Button>
  ) : (
    ''
  )

  // Render cell with link when required (external or internal)
  // Using ternary to get rid of unnecessary checks to linkColumns if
  // linkColumns is empty
  const renderLinkableCell = linkColumns
    ? (cell) => {
        for (let i = 0; i < linkColumns.length; i++) {
          if (linkColumns[i].column === cell.column.id) {
            if (linkColumns[i].isExternal) {
              return (
                // TODO: Check for http[s]? and www before prepending
                <Link href={`https://www.${cell.value}`} isExternal={true}>
                  {cell.render('Cell')}
                </Link>
              )
            } else {
              return (
                <Link
                  as={RouteLink}
                  to={`${prependLink}${slugify(cell.value)}${appendLink}`}
                >
                  {cell.render('Cell')}
                </Link>
              )
            }
          }
        }
        return cell.render('Cell')
      }
    : (cell) => cell.render('Cell')

  return (
    <Box ref={wrapperRef}>
      {titleButtonElement}
      <Collapse isOpen={show}>
        <ReactTableGlobalFilter
          preGlobalFilteredRows={preGlobalFilteredRows}
          globalFilter={state.globalFilter}
          setGlobalFilter={setGlobalFilter}
          mt="4px"
          mb="4px"
        />
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
                          style={{ textAlign: 'center' }}
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
                          style={cell.column.style}
                        >
                          {renderLinkableCell(cell)}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </Table>
        </Box>
        <Box className="pagination" hidden={!show} mt="0.25em">
          <Stack
            isInline
            align="center"
            flexWrap="wrap"
            justify="space-between"
          >
            <Stack spacing="1em" isInline align="center" flexWrap="wrap">
              <IconButton
                onClick={() => {
                  wrapperRef.current.scrollIntoView()
                  gotoPage(0)
                }}
                disabled={!canPreviousPage}
                icon="arrow-left"
                aria-label="Go to first page"
              />
              <IconButton
                onClick={() => {
                  wrapperRef.current.scrollIntoView(true)
                  previousPage()
                }}
                disabled={!canPreviousPage}
                icon="chevron-left"
                aria-label="Go to previous page"
              />
              <IconButton
                onClick={() => {
                  wrapperRef.current.scrollIntoView(true)
                  nextPage()
                }}
                disabled={!canNextPage}
                icon="chevron-right"
                aria-label="Go to next page"
              />
              <IconButton
                onClick={() => {
                  wrapperRef.current.scrollIntoView(true)
                  gotoPage(pageCount - 1)
                }}
                disabled={!canNextPage}
                icon="arrow-right"
                aria-label="Go to last page"
              />
              <Stack isInline align="center" spacing="4px">
                <Box>
                  <label htmlFor={`${title}-goTo`}>
                    <Trans>Go to page:</Trans>
                  </label>
                </Box>
                <Input
                  id={`${title}-goTo`}
                  width="6rem"
                  value={goToPageValue}
                  onChange={(event) => {
                    handleGoToPageChange(event)
                  }}
                />
              </Stack>
              <Text>
                <Trans>
                  Page {pageIndex + 1} of {pageOptions.length}
                </Trans>
              </Text>
            </Stack>
            <Stack spacing="1em" isInline align="center" flexWrap="wrap">
              <Select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  wrapperRef.current.scrollIntoView(true)
                }}
                width="fit-content"
              >
                {[5, 10, 20].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    {t`Show ${pageSize}`}
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

DmarcReportTable.propTypes = {
  data: array.isRequired,
  columns: array.isRequired,
  title: string.isRequired,
  initialSort: array.isRequired,
  hideTitleButton: bool,
  linkColumns: array,
  prependLink: string,
  appendLink: string,
}

export default WithPseudoBox(DmarcReportTable)
