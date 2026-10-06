import React, { useState } from 'react'
import { Button, IconButton, Text, useDisclosure } from '@chakra-ui/react'
import { ListOf } from '../components/ListOf'
import { Trans, useLingui } from '@lingui/react/macro'
import { EditIcon, MinusIcon, SettingsIcon } from '@chakra-ui/icons'
import { AdminDomainCard } from './AdminDomainCard'
import { CvdEnrollmentModal } from './CvdEnrollmentModal'
import { array, bool, func, string } from 'prop-types'

export function AdminDomainList({
  nodes,
  verified,
  permission,
  orgId,
  setSelectedRemoveProps,
  removeOnOpen,
  setModalProps,
  updateOnOpen,
}) {
  const { t } = useLingui()
  const { isOpen: cvdIsOpen, onOpen: cvdOnOpen, onClose: cvdOnClose } = useDisclosure()
  const [selectedCvdDomain, setSelectedCvdDomain] = useState({ domainId: '', domain: '', cvdEnrollment: null })

  return (
    <>
      <ListOf
        elements={nodes}
        ifEmpty={() => (
          <Text layerStyle="loadingMessage">
            <Trans>No Domains</Trans>
          </Text>
        )}
      >
        {(
          {
            id: domainId,
            domain,
            claimTags,
            archived,
            rcode,
            organizations,
            assetState,
            cvdEnrollment,
            highAvailability,
            orgHasOwnership,
          },
          index,
        ) => (
          <React.Fragment key={`admindomain-${index}`}>
            <AdminDomainCard
              url={domain}
              tags={claimTags}
              assetState={assetState}
              isArchived={archived}
              rcode={rcode}
              cvdEnrollment={cvdEnrollment}
              highAvailability={highAvailability}
              flexGrow={1}
              fontSize={{ base: '75%', sm: '100%' }}
            >
              {(!verified || permission === 'SUPER_ADMIN' || rcode === 'NXDOMAIN') && (
                <IconButton
                  data-testid={`remove-${index}`}
                  onClick={() => {
                    setSelectedRemoveProps({ domain, domainId, rcode })
                    removeOnOpen()
                  }}
                  variant="danger"
                  px="2"
                  icon={<MinusIcon />}
                  aria-label={'Remove ' + domain}
                  mr="1"
                />
              )}
              <IconButton
                data-testid={`edit-${index}`}
                variant="primary"
                px="2"
                onClick={() => {
                  setModalProps({
                    archived,
                    mutation: 'update',
                    assetState,
                    tagInputList: claimTags,
                    editingDomainId: domainId,
                    editingDomainUrl: domain,
                    orgCount: organizations.totalCount,
                    highAvailability,
                    permission,
                  })
                  updateOnOpen()
                }}
                icon={<EditIcon />}
                aria-label={'Edit ' + domain}
                mr="2"
              />
              {orgHasOwnership && (
                <Button
                  data-testid={`edit-cvd-${index}`}
                  variant="primary"
                  px="2"
                  onClick={() => {
                    setSelectedCvdDomain({ domainId, domain, cvdEnrollment })
                    cvdOnOpen()
                  }}
                  leftIcon={<SettingsIcon />}
                  aria-label={t`Edit CVD enrollment`}
                  mr="2"
                >
                  <Trans>CVD</Trans>
                </Button>
              )}
            </AdminDomainCard>
          </React.Fragment>
        )}
      </ListOf>
      <CvdEnrollmentModal isOpen={cvdIsOpen} onClose={cvdOnClose} orgId={orgId} {...selectedCvdDomain} />
    </>
  )
}
AdminDomainList.propTypes = {
  nodes: array.isRequired,
  verified: bool,
  permission: string,
  orgId: string,
  setSelectedRemoveProps: func.isRequired,
  removeOnOpen: func.isRequired,
  setModalProps: func.isRequired,
  updateOnOpen: func.isRequired,
}
