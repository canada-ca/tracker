import React from 'react'
import {
  Button,
  ButtonGroup,
  Flex,
  FocusLock,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Text,
  useDisclosure,
} from '@chakra-ui/react'
import { arrayOf, object, string, func } from 'prop-types'
import { json2csvAsync } from 'json-2-csv'
import { t, Trans } from '@lingui/macro'
import { any } from 'prop-types'
import { Popover, PopoverTrigger, PopoverContent, PopoverArrow, PopoverCloseButton } from '@chakra-ui/react'
import { ABTestWrapper, ABTestVariant } from '../app/ABTestWrapper'

export function ExportButton({ jsonData, fileName, dataFunction, children = t`Export to CSV`, ...props }) {
  const { onOpen, onClose, isOpen } = useDisclosure()
  const firstFieldRef = React.useRef(null)

  const download = async (name) => {
    try {
      let data
      if (jsonData) {
        data = await json2csvAsync(jsonData)
      } else if (dataFunction) {
        data = await dataFunction()
      }

      const a = document.createElement('a')
      a.href = 'data:text/csv;charset=utf-8,' + encodeURI(data)
      a.download = `${name}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      onClose()
    } catch (err) {
      console.log(err)
    }
  }

  return (
    <ABTestWrapper insiderVariantName="B">
      <ABTestVariant name="A">
        <Button {...props} variant="primary" onClick={() => download(fileName)}>
          {children}
        </Button>
      </ABTestVariant>
      <ABTestVariant name="B">
        <Popover
          isOpen={isOpen}
          initialFocusRef={firstFieldRef}
          onOpen={onOpen}
          onClose={onClose}
          placement="right"
          closeOnBlur={false}
        >
          <PopoverTrigger>
            <Button {...props} variant="primary">
              {children}
            </Button>
          </PopoverTrigger>
          <PopoverContent p={5}>
            <FocusLock returnFocus persistentFocus={false}>
              <PopoverArrow />
              <PopoverCloseButton />
              <Stack spacing={4}>
                <FormControl>
                  <FormLabel htmlFor="file-name">
                    <Trans>File name:</Trans>
                  </FormLabel>
                  <Flex align="center">
                    <Input ref={firstFieldRef} id="file-name" defaultValue={fileName} mr="1" />
                    <Text>.csv</Text>
                  </Flex>
                </FormControl>
                <ButtonGroup display="flex" justifyContent="flex-end">
                  <Button variant="outline" onClick={onClose}>
                    <Trans>Cancel</Trans>
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      download(firstFieldRef.current?.value || fileName)
                    }}
                  >
                    <Trans>Download</Trans>
                  </Button>
                </ButtonGroup>
              </Stack>
            </FocusLock>
          </PopoverContent>
        </Popover>
      </ABTestVariant>
    </ABTestWrapper>
  )
}

ExportButton.propTypes = {
  jsonData: arrayOf(object),
  fileName: string,
  dataFunction: func,
  children: any,
}
