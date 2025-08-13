// Environment setup for Jest tests
process.env.NODE_ENV = 'test'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing-only'
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db'
process.env.REDIS_URL = 'redis://localhost:6379'
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters'
process.env.OPENAI_API_KEY = 'test-openai-key'
process.env.APP_URL = 'http://localhost:3000'

// Disable external services in tests
process.env.ENABLE_EXTERNAL_APIS = 'false'
process.env.ENABLE_WEBHOOKS = 'false'
process.env.ENABLE_NOTIFICATIONS = 'false'
process.env.ENABLE_MONITORING = 'false'