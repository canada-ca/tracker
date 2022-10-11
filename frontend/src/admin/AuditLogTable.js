import { useQuery } from '@apollo/client'
import { useToast } from '@chakra-ui/react'
import React from 'react'
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
} from '@chakra-ui/react'

import { AUDIT_LOGS } from '../graphql/queries'
import { LoadingMessage } from '../components/LoadingMessage'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'

export function AuditLogTable() {
  const toast = useToast()
  const { loading, error, data } = useQuery(AUDIT_LOGS, {
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    errorPolicy: 'ignore',
    variables: {
      first: 100,
      orderBy: { field: 'TIMESTAMP', direction: 'ASC' },
    },
    onError: (error) => {
      const [_, message] = error.message.split(': ')
      toast({
        title: 'Error',
        description: message,
        status: 'error',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    },
  })

  if (loading) {
    return <LoadingMessage>Audit Logs</LoadingMessage>
  }

  if (error) {
    return <ErrorFallbackMessage error={error} />
  }

  return (
    <TableContainer>
      <Table>
        <Thead>
          <Tr>
            <Th>Time Generated</Th>
            <Th>Initiated By</Th>
            <Th>Action</Th>
            <Th>Resource Type</Th>
            <Th>Resource Name</Th>
            <Th>Organization</Th>
            <Th>Reason</Th>
            <Th>Status</Th>
          </Tr>
        </Thead>
        <Tbody>
          {data?.findAuditLogs.edges.map(({ node }, idx) => {
            const { timestamp, initiatedBy, action, target, reason, status } =
              node
            return (
              <Tr key={idx}>
                <Td>{timestamp}</Td>
                <Td>{initiatedBy.userName}</Td>
                <Td>{action.toUpperCase()}</Td>
                <Td>{target.resourceType.toUpperCase()}</Td>
                <Td>{target.resource}</Td>
                <Td>{target.organization}</Td>
                <Td>{reason}</Td>
                <Td>{status.toUpperCase()}</Td>
              </Tr>
            )
          })}
        </Tbody>
      </Table>
    </TableContainer>
  )
}
