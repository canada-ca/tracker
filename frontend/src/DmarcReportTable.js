import React from 'react'
import styled from '@emotion/styled'
import { GET_ALIGNED_BY_IP, GET_YEARLY_REPORT } from './graphql/queries'
import { useQuery } from '@apollo/react-hooks'
import { slugify } from './slugify'
import { useUserState } from './UserState'
import { useTable } from 'react-table'
import { array } from 'prop-types'
import { Box } from '@chakra-ui/core'

import WithPseudoBox from './withPseudoBox'

const Table = styled.table`
width: 100%;
border-collapse: collapse;

tr:nth-of-type(odd) {
background: #eee;
}

th {
background: #333;
color: white;
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

    td:nth-of-type(1):before { content: "zzz"; }

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
    <Box overflowX="auto">
      <Table {...getTableProps()} flatHeaders={flatHeaders}>
        <thead>
          <tr className="titleBar" {...headerGroups[0].getHeaderGroupProps()}>
            <th
              className="title"
              {...headerGroups[0].headers[0].getHeaderProps()}
            >
              {headerGroups[0].headers[0].render('Header')}
            </th>
          </tr>
          {headerGroups.slice(1).map((headerGroup) => (
            <tr className="category" {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th {...column.getHeaderProps()}>{column.render('Header')}</th>
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
                  return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                })}
              </tr>
            )
          })}
        </tbody>
      </Table>
    </Box>
  )
}

DmarcReportTable.propTypes = {
  data: array.isRequired,
  columns: array.isRequired,
}

export default WithPseudoBox(DmarcReportTable)
