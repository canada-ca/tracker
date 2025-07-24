import React, { useState } from 'react'
import { Badge, Box, Button, Collapse, Flex, IconButton, Text, Tooltip, useToast } from '@chakra-ui/react'
import { DOMAIN_TAGS } from '../graphql/queries'
import { useQuery } from '@apollo/client'
import { EditIcon, PlusSquareIcon, ViewOffIcon } from '@chakra-ui/icons'
import { LoadingMessage } from '../components/LoadingMessage'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { TagForm } from './TagForm'
import { t, Trans } from '@lingui/macro'
import { string } from 'prop-types'

export const DomainTagsList = ({ orgId, createOwnership }) => {
  const [tagFormState, setTagFormState] = useState({ editingTags: {}, isCreatingTag: false })
  const toast = useToast()

  const { loading, error, data } = useQuery(DOMAIN_TAGS, {
    variables: { orgId },
    errorPolicy: 'ignore',
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

  if (loading) return <LoadingMessage />
  if (error) return <ErrorFallbackMessage />

  const ownershipBadgeColour = (ownership) => {
    switch (ownership) {
      case 'GLOBAL':
        return 'weak'
      case 'ORG':
        return 'info'
      case 'PENDING':
        return 'strong'
      default:
        return 'primary'
    }
  }

  const ownershipLabel = {
    GLOBAL: t`Global`,
    ORG: t`Organization`,
    PENDING: t`Pending`,
  }

  let tagList
  if (data.findAllTags.length === 0) {
    tagList = (
      <Text layerStyle="loadingMessage">
        <Trans>No Tags</Trans>
      </Text>
    )
  } else {
    tagList = data.findAllTags.map(({ tagId, label, description, isVisible, ownership, organizations }) => {
      return (
        <Box key={tagId}>
          <Flex align="center" mb="2">
            <IconButton
              aria-label={`edit tag`}
              icon={<EditIcon boxSize="icons.md" />}
              variant="primary"
              onClick={() =>
                setTagFormState((prev) => ({
                  ...prev,
                  editingTags: { ...prev.editingTags, [tagId]: !prev.editingTags[tagId] },
                }))
              }
              mr="2"
            />
            <Flex
              w="100%"
              align="center"
              justifyContent="space-between"
              bg="gray.100"
              px="2"
              py="1"
              rounded="md"
              borderWidth="1px"
              borderColor="black"
            >
              <Flex align="center">
                <Tooltip label={description} aria-label={`tag-tooltip-${tagId}`} placement="right">
                  <Text fontWeight="bold" mr="2">
                    {label.toUpperCase()}
                  </Text>
                </Tooltip>
                {organizations && ownership !== 'GLOBAL' && (
                  <Text fontWeight="bold" mr="2">
                    ({organizations.map(({ acronym }) => acronym).join(', ')})
                  </Text>
                )}
                {!isVisible && <ViewOffIcon aria-label="tag-invisible" boxSize="icons.md" />}
              </Flex>
              <Badge
                variant="solid"
                bg={ownershipBadgeColour(ownership)}
                mr={{ md: '1rem' }}
                justifySelf={{ base: 'start', md: 'end' }}
              >
                {ownershipLabel[ownership]}
              </Badge>
            </Flex>
          </Flex>
          <Collapse in={!!tagFormState.editingTags[tagId]}>
            <TagForm
              mutation="update"
              visible={isVisible}
              ownership={ownership}
              tagId={tagId}
              tagFormState={tagFormState}
              setTagFormState={setTagFormState}
            />
          </Collapse>
        </Box>
      )
    })
  }

  return (
    <Box>
      <Box mb="4">
        <Button
          variant="primary"
          onClick={() => setTagFormState((prev) => ({ ...prev, isCreatingTag: !prev.isCreatingTag }))}
          rightIcon={<PlusSquareIcon boxSize="icons.lg" />}
          mb="2"
        >
          <Trans>Add Tag</Trans>
        </Button>
        <Collapse in={tagFormState.isCreatingTag}>
          <TagForm
            mutation="create"
            tagFormState={tagFormState}
            setTagFormState={setTagFormState}
            ownership={createOwnership}
            orgId={orgId}
          />
        </Collapse>
      </Box>
      {tagList}
    </Box>
  )
}

DomainTagsList.propTypes = {
  orgId: string,
  createOwnership: string,
}
