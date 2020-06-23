import React from 'react'
import { useQuery } from '@apollo/react-hooks'
import { Trans } from '@lingui/macro'
import { Layout } from './Layout'
import {
  Stack,
  useToast,
  Text,
  Button,
  InputGroup,
  InputLeftElement,
  Icon,
  Input,
  SimpleGrid,
} from '@chakra-ui/core'
import { DOMAINS } from './graphql/queries'
import { useUserState } from './UserState'
import { DomainList } from './DomainList'
import { PaginationButtons } from './PaginationButtons'

export default function DomainsPage() {
  const { currentUser } = useUserState()
  const toast = useToast()
  const { loading, _error, data } = useQuery(DOMAINS, {
    context: {
      headers: {
        authorization: currentUser.jwt,
      },
    },
    onError: (error) => {
      const [_, message] = error.message.split(': ')
      toast({
        title: 'Error',
        description: message,
        status: 'failure',
        duration: 9000,
        isClosable: true,
      })
    },
  })

  // let domains = []
  // if (data && data.domains.edges) {
  //   domains = data.domains.edges.map((e) => e.node)
  // }

  if (loading)
    return (
      <p>
        <Trans>Loading...</Trans>
      </p>
    )

  return (
    <Layout>
      <Stack shouldWrapChildren>
        <Text fontWeight="bold" fontSize="2xl">
          <Trans>Domains</Trans>
        </Text>
        <SimpleGrid mb={6} columns={{ md: 1, lg: 2 }} spacing="15px">
          <InputGroup>
            <InputLeftElement>
              <Icon name="search" color="gray.300" />
            </InputLeftElement>
            <Input type="text" placeholder="Search for domain" />
          </InputGroup>
          <Button
            width={'70%'}
            leftIcon="add"
            variantColor="blue"
            onClick={() => {
              window.alert('add domain')
            }}
          >
            Add Domain
          </Button>
          )
        </SimpleGrid>
        {/* {data && data.domains && ( */}
        <Stack spacing={4}>
          <Stack spacing={4} direction="row" flexWrap="wrap">
            <DomainList domainsData={data} />
          </Stack>
          <PaginationButtons next={false} previous={false} />
        </Stack>
        {/* )} */}
      </Stack>
    </Layout>
  )
}
