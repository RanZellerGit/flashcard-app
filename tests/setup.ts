import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Polyfill IndexedDB for tests
import 'fake-indexeddb/auto'

// Suppress console errors during tests if needed
const originalError = console.error
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})
