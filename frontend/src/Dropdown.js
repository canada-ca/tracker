import React, { useEffect, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { array, func, string } from 'prop-types'

export function Dropdown({ options, prompt, onChange, value }) {
  const Dropdown = styled.div`
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
  `

  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const ref = useRef(null)

  // useEffect(() => {
  //   document.addEventListener('click', close)
  //   return () => document.removeEventListener('click', close)
  // }, [])

  // function close(e) {
  //   setOpen(e && e.target === ref.current)
  //   console.log('blur')
  // }

  function filter(options) {
    return options.filter(
      (option) =>
        option.label.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1,
    )
  }

  // function displayValue() {
  //   if (searchTerm.length > 0) return searchTerm
  //   else if (value && value !== 'none') return value
  //   else return ''
  // }

  return (
    <Dropdown>
      <div className="dropdown">
        <div className="control" onClick={() => setOpen((prev) => !prev)}>
          <div className="selected-value">
            <input
              type="text"
              ref={ref}
              placeholder={value !== 'none' ? value : prompt}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
              }}
            />
          </div>
          <div className={`arrow ${open ? 'open' : null}`} />
        </div>
        <div className={`options ${open ? 'open' : null}`}>
          {filter(options).map((option, idx) => (
            <div
              key={idx}
              className="option"
              onClick={() => {
                onChange(option)
                setSearchTerm('')
                setOpen(false)
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      </div>
    </Dropdown>
  )
}

Dropdown.propTypes = {
  options: array,
  prompt: string,
  onChange: func,
  value: string,
}
