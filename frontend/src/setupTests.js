import '@testing-library/jest-dom/extend-expect'
import { matchers } from 'jest-emotion'
expect.extend(matchers)

process.env.GOOGLE_ANALYTICS_ID = 'UA-something'
