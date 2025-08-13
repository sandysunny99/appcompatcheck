import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'
import { webcrypto } from 'crypto'

// Mock crypto API
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock webcrypto for Edge Runtime compatibility
Object.defineProperty(global, 'crypto', {
  value: webcrypto,
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null
  }
  disconnect() {
    return null
  }
  unobserve() {
    return null
  }
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {
    return null
  }
  disconnect() {
    return null
  }
  unobserve() {
    return null
  }
}

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock window.location
delete window.location
window.location = {
  href: 'http://localhost:3000',
  origin: 'http://localhost:3000',
  pathname: '/',
  search: '',
  hash: '',
  assign: jest.fn(),
  reload: jest.fn(),
  replace: jest.fn(),
}

// Mock process.env for tests
process.env.NODE_ENV = 'test'
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db'
process.env.REDIS_URL = 'redis://localhost:6379'

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to ignore a specific log level
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// Global test timeout
jest.setTimeout(10000)

// Mock fetch globally
global.fetch = jest.fn()

// Mock WebSocket
global.WebSocket = class MockWebSocket {
  constructor(url) {
    this.url = url
    this.readyState = 1
    this.onopen = null
    this.onclose = null
    this.onmessage = null
    this.onerror = null
  }
  
  send() {}
  close() {}
}

// Mock file reader
global.FileReader = class MockFileReader {
  constructor() {
    this.readyState = 0
    this.result = null
    this.onload = null
    this.onerror = null
  }
  
  readAsDataURL() {
    this.readyState = 2
    this.result = 'data:text/plain;base64,dGVzdA=='
    if (this.onload) this.onload({ target: this })
  }
  
  readAsText() {
    this.readyState = 2
    this.result = 'test content'
    if (this.onload) this.onload({ target: this })
  }
}

// Mock PDF generation
jest.mock('jspdf', () => {
  return jest.fn().mockImplementation(() => ({
    text: jest.fn(),
    addPage: jest.fn(),
    save: jest.fn(),
    internal: {
      pageSize: { width: 210, height: 297 }
    }
  }))
})

// Mock Chart.js
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
  CategoryScale: {},
  LinearScale: {},
  BarElement: {},
  Title: {},
  Tooltip: {},
  Legend: {},
}))

// Setup cleanup
afterEach(() => {
  jest.clearAllMocks()
  jest.clearAllTimers()
})