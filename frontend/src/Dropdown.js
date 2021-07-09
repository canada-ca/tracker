import React, { useEffect, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { array, func, string } from 'prop-types'

const Select = styled.div`
  .dropdown {
    position: relative;
    color: #333;
    cursor: default;
  }

  .dropdown .arrow {
    border-color: #999 transparent transparent;
    border-style: solid;
    border-width: 5px 5px 0;
    content: ' ';
    display: block;
    height: 0;
    margin-top: 0.3rem;
    position: absolute;
    right: 10px;
    top: 14px;
    width: 0;
  }

  .dropdown .arrow.open {
    border-color: transparent transparent #999;
    border-width: 0 5px 5px;
  }

  .dropdown .selected-value input {
    line-height: 1.5;
    font-size: 1rem;
    background-color: #fff;
    border: 1px solid #ccc;
    border-radius: 2px;
    box-sizing: border-box;
    cursor: default;
    outline: none;
    padding: 8px 52px 8px 10px;
    transition: all 200ms ease;
    width: 100%;
  }

  .dropdown .options {
    display: none;
    background-color: #fff;
    border: 1px solid #ccc;
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.06);
    box-sizing: border-box;
    margin-top: -1px;
    max-height: 200px;
    overflow-y: auto;
    position: absolute;
    top: 100%;
    width: 100%;
    z-index: 1000;
    -webkit-overflow-scrolling: touch;
  }

  .dropdown .options.open {
    display: block;
  }

  .dropdown .option {
    box-sizing: border-box;
    color: rgba(51, 51, 51, 0.8);
    cursor: pointer;
    display: block;
    padding: 8px 10px;
  }

  .dropdown .option.selected,
  .dropdown .option:hover {
    background-color: #f2f9fc;
    color: #333;
  }

  .dropdown .option.selected,
  .dropdown .option:focus {
    background-color: #f2f9fc;
    border: 2px solid blue;
    color: #222;
  }

  .dropdown input:focus {
    border: 2px solid blue;
    color: #222;
  }
`

export function Dropdown({ options, placeholder, onChange, ...props }) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const inputRef = useRef(null)
  const optionRefs = []

  let inputElement

  useEffect(() => {
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  function close(e) {
    setOpen(e && e.target === inputRef.current)
  }

  function filter(options) {
    return options.filter(
      (option) =>
        option.label.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1,
    )
  }

  function findFocus() {
    return document.activeElement
  }

  const setOptRef = (element) => {
    if (element !== null) {
      optionRefs.push(element)
    }
  }

  function handleInputOnKeyDown(e) {
    inputElement = findFocus()
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
        setSearchTerm('')
        setOpen(false)
        inputElement.focus()
        break
      case 'Escape':
        setOpen(false)
        inputElement.focus()
        break
      case 'ArrowUp':
        e.preventDefault()
        if (index === 0) inputElement.focus()
        else optionRefs[index - 1].focus()
        break
      case 'ArrowDown':
        e.preventDefault()
        if (index + 1 >= optionRefs.length) inputElement.focus()
        else optionRefs[index + 1].focus()
        break
      default:
    }
  }

  return (
    <Select {...props}>
      <div className="dropdown">
        <div className="control">
          <div className="selected-value">
            <input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
              }}
              onClick={close}
              onKeyDown={handleInputOnKeyDown}
            />
          </div>
          <div className={`arrow ${open ? 'open' : null}`} />
        </div>
        <div className={`options ${open ? 'open' : null}`}>
          {filter(options).map((option, idx) => (
            <div
              tabIndex={-1}
              key={option.value.id}
              className="option"
              onClick={() => {
                onChange(option)
                setSearchTerm('')
                setOpen(false)
              }}
              onKeyDown={(e) => handleOptionOnKeyDown(e, option, idx)}
              ref={setOptRef}
            >
              {option.label}
            </div>
          ))}
        </div>
      </div>
    </Select>
  )
}

Dropdown.propTypes = {
  options: array,
  placeholder: string,
  onChange: func,
  value: string,
}
