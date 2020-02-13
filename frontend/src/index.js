import { hot } from 'react-hot-loader/root'
import React from 'react'
import { render } from 'react-dom'
import { App } from './App'

hot(<App />)

render(<App />, document.getElementById('root'))
