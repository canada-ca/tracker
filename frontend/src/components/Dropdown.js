import React, { useEffect, useRef, useState } from 'react'
import { array, func, string } from 'prop-types'
import { Box, Text, Input, InputGroup, InputRightElement, Flex, InputLeftElement } from '@chakra-ui/react'
import { ChevronDownIcon, ChevronUpIcon, SearchIcon } from '@chakra-ui/icons'

export function Dropdown({ label, labelDirection, options, placeholder, onChange, searchValue, onSearch, ...props }) {
  const [open, setOpen] = useState(false)
  const inputRef = useRef(null)
  const optionRefs = []

  useEffect(() => {
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  function close(e) {
    setOpen(e && e.target === inputRef.current)
  }

  const setOptRef = (element) => {
    if (element !== null) {
      optionRefs.push(element)
    }
  }

  function handleInputOnKeyDown(e) {
    switch (e.key) {
      case 'Enter':
        setOpen(!open)
        break
      case 'Escape':
        setOpen(false)
        break
      case 'ArrowDown':
        e.preventDefault()
        optionRefs.length > 0 && optionRefs[0].focus()
        break
      case 'ArrowUp':
        e.preventDefault()
        optionRefs.length > 0 && optionRefs[optionRefs.length - 1].focus()
        break
      default:
    }
  }

  function handleOptionOnKeyDown(e, option, index) {
    switch (e.key) {
      case 'Enter':
        onChange(option)
        onSearch('')
        setOpen(false)
        inputRef.current.focus()
        break
      case 'Escape':
        setOpen(false)
        inputRef.current.focus()
        break
      case 'ArrowUp':
        e.preventDefault()
        if (index === 0) inputRef.current.focus()
        else optionRefs[index - 1].focus()
        break
      case 'ArrowDown':
        e.preventDefault()
        if (index + 1 >= optionRefs.length) inputRef.current.focus()
        else optionRefs[index + 1].focus()
        break
      default:
    }
  }

  return (
    <Box
      // Parent box
      {...props}
      w={{ base: '100%', md: '75%' }}
      position="relative"
      color="#333"
      cursor="default"
      aria-pressed={open}
      aria-expanded={open}
    >
      <Box
        // Box containing label and input
        lineHeight={1.5}
        fontSize="1rem"
        boxSizing="border-box"
        cursor="default"
        outline="none"
        transition="all 200ms ease"
        width="100%"
        _focus={{
          border: '2px solid blue',
          color: '#222',
        }}
      >
        <label>
          <Flex flexDirection={{ base: 'column', md: labelDirection }} align="center">
            <Text fontWeight="bold" fontSize="2xl" mr={{ base: '0', md: '4' }}>
              {label}
            </Text>
            <InputGroup>
              <InputLeftElement>
                <SearchIcon boxSize="icons.md" />
              </InputLeftElement>
              <Input
                borderColor="black"
                borderWidth="1px"
                ref={inputRef}
                type="text"
                placeholder={placeholder}
                value={searchValue}
                onChange={(e) => {
                  onSearch(e.target.value)
                }}
                onClick={close}
                onKeyDown={handleInputOnKeyDown}
              />
              <InputRightElement>
                <InputRightElement>
                  {open ? <ChevronUpIcon boxSize="icons.md" /> : <ChevronDownIcon boxSize="icons.md" />}
                </InputRightElement>
              </InputRightElement>
            </InputGroup>
          </Flex>
        </label>
      </Box>
      <Box
        // Box containing list of options
        display={open ? 'block' : 'none'}
        bgColor="#fff"
        border="1px solid #ccc"
        boxShadow="0 1px 0 rgba(0, 0, 0, 0.06)"
        boxSizing="border-box"
        marginTop="2px"
        maxH="200px"
        overflowY="auto"
        position="absolute"
        top="100%"
        width="100%"
        zIndex={1000}
      >
        {options.map((option, idx) => (
          <Box
            // Box containing individual options
            tabIndex={0}
            key={option.value.id}
            boxSizing="border-box"
            color="rgba(51, 51, 51, 0.8)"
            cursor="pointer"
            display="block"
            padding="8px 10px"
            _hover={{ bgColor: '#f2f9fc', color: '#333' }}
            _focus={{
              bgColor: '#f2f9fc',
              border: '2px solid blue',
              color: '#222',
            }}
            onClick={() => {
              onChange(option)
              onSearch('')
              setOpen(false)
            }}
            onKeyDown={(e) => handleOptionOnKeyDown(e, option, idx)}
            ref={setOptRef}
          >
            {option.label}
          </Box>
        ))}
      </Box>
    </Box>
  )
}

Dropdown.propTypes = {
  label: string,
  labelDirection: string,
  options: array,
  placeholder: string,
  onChange: func,
  searchValue: string,
  onSearch: func,
}
