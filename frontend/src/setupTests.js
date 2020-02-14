import '@babel/polyfill'
import '@testing-library/jest-dom/extend-expect'
import { configure } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import { matchers } from 'jest-emotion'
expect.extend(matchers)

configure({ adapter: new Adapter() })
process.env.GOOGLE_ANALYTICS_ID = 'UA-something'
