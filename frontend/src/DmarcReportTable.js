import React from 'react'
import styled from '@emotion/styled'
import { GET_ALIGNED_BY_IP, GET_YEARLY_REPORT } from './graphql/queries'
import { useQuery } from '@apollo/react-hooks'
import { slugify } from './slugify'
import { useUserState } from './UserState'
import { useTable } from 'react-table'
import { array } from 'prop-types'
import { Box, Button, Collapse, PseudoBox } from '@chakra-ui/core'

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
  const { data, columns } = props
  const { currentUser } = useUserState()
  const [show, setShow] = React.useState(true)

  const handleShow = () => setShow(!show)

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    flatHeaders,
  } = useTable({
    columns,
    data,
  })

  return (
    <>
      <Button bg="gray.700" color="white" onClick={handleShow} w="100%">
        {flatHeaders[0].Header}
      </Button>
      <Box overflowX="auto">
        <Collapse isOpen={show}>
          <Table {...getTableProps()} flatHeaders={flatHeaders}>
            <thead>
              {headerGroups.slice(1).map((headerGroup) => (
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
              {rows.map((row, i) => {
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
        </Collapse>
      </Box>
    </>
  )
}

DmarcReportTable.propTypes = {
  data: array.isRequired,
  columns: array.isRequired,
}

export default WithPseudoBox(DmarcReportTable)
