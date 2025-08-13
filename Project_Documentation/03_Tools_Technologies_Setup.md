# Tools & Technologies Setup Guide

## Table of Contents
- [Technology Stack Overview](#technology-stack-overview)
- [Development Environment Setup](#development-environment-setup)
- [Frontend Technologies](#frontend-technologies)
- [Backend Technologies](#backend-technologies)
- [Database & Caching](#database--caching)
- [DevOps & Infrastructure](#devops--infrastructure)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Monitoring & Observability](#monitoring--observability)
- [Third-party Integrations](#third-party-integrations)

## Technology Stack Overview

### Architecture Decision Summary

| Category | Technology | Version | Justification |
|----------|------------|---------|---------------|
| **Frontend Framework** | Next.js | 15.x | Full-stack React framework with SSR/SSG |
| **UI Library** | React | 19.x | Component-based UI with latest features |
| **Language** | TypeScript | 5.x | Type safety and better developer experience |
| **Styling** | Tailwind CSS | 3.x | Utility-first CSS framework |
| **Component Library** | Radix UI | Latest | Accessible, unstyled UI primitives |
| **Database** | PostgreSQL | 15+ | Robust relational database with JSON support |
| **ORM** | Drizzle ORM | Latest | Type-safe, lightweight ORM |
| **Caching** | Redis | 7+ | In-memory data structure store |
| **Container** | Docker | Latest | Application containerization |
| **Orchestration** | Kubernetes | 1.28+ | Container orchestration |
| **CI/CD** | GitHub Actions | Latest | Integrated version control and automation |

## Development Environment Setup

### Prerequisites Installation

#### 1. Node.js & npm
```bash
# Install Node.js 20.x (LTS)
# Option 1: Using Node Version Manager (Recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
nvm alias default 20

# Option 2: Direct download
# Visit https://nodejs.org and download Node.js 20.x LTS

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x

# Update npm to latest
npm install -g npm@latest
```

#### 2. Git Configuration
```bash
# Install Git (if not already installed)
# Ubuntu/Debian
sudo apt update && sudo apt install git

# macOS (using Homebrew)
brew install git

# Windows (using Chocolatey)
choco install git

# Configure Git
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
git config --global init.defaultBranch main
git config --global pull.rebase false
```

#### 3. Docker Installation
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
# Logout and login again

# macOS
# Download Docker Desktop from https://www.docker.com/products/docker-desktop/

# Windows
# Download Docker Desktop from https://www.docker.com/products/docker-desktop/

# Verify installation
docker --version
docker-compose --version
```

### IDE and Editor Setup

#### Visual Studio Code (Recommended)
```bash
# Install VS Code
# Ubuntu/Debian
sudo snap install code --classic

# macOS
brew install --cask visual-studio-code

# Windows
# Download from https://code.visualstudio.com/

# Essential Extensions
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension bradlc.vscode-tailwindcss
code --install-extension ms-playwright.playwright
code --install-extension ms-vscode.vscode-json
code --install-extension esbenp.prettier-vscode
code --install-extension dbaeumer.vscode-eslint
code --install-extension ms-vscode.vscode-docker
code --install-extension GitHub.vscode-github-actions
```

#### VS Code Configuration
```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ],
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

## Frontend Technologies

### Next.js 15 Setup
```bash
# Create new Next.js project
npx create-next-app@latest appcompatcheck --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Or clone existing project
git clone https://github.com/sandysunny99/appcompatcheck.git
cd appcompatcheck

# Install dependencies
npm install

# Install additional dependencies
npm install @radix-ui/react-dropdown-menu @radix-ui/react-navigation-menu @radix-ui/react-sheet @radix-ui/react-toast @radix-ui/react-separator @radix-ui/react-avatar @radix-ui/react-badge
```

### Essential Frontend Packages
```bash
# UI Components and Styling
npm install tailwindcss-animate class-variance-authority clsx tailwind-merge
npm install lucide-react react-icons
npm install next-themes  # Theme switching

# State Management
npm install zustand jotai  # Choose one based on preference

# Forms and Validation
npm install react-hook-form @hookform/resolvers zod

# Data Fetching
npm install @tanstack/react-query axios swr

# Charts and Visualization
npm install recharts react-chartjs-2 chart.js

# Real-time Communication
npm install socket.io-client ws

# Date and Time
npm install date-fns dayjs

# Development Tools
npm install --save-dev @types/node @types/react @types/react-dom
npm install --save-dev eslint-config-next @typescript-eslint/eslint-plugin
npm install --save-dev prettier prettier-plugin-tailwindcss
npm install --save-dev husky lint-staged
```

### Tailwind CSS Configuration
```javascript
// tailwind.config.ts
import type { Config } from 'tailwindcss'
import { fontFamily } from 'tailwindcss/defaultTheme'
import tailwindcssAnimate from 'tailwindcss-animate'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', ...fontFamily.sans],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [tailwindcssAnimate],
}

export default config
```

## Backend Technologies

### Next.js API Routes Setup
```bash
# Install backend dependencies
npm install bcryptjs jsonwebtoken
npm install @types/bcryptjs @types/jsonwebtoken --save-dev

# Database and ORM
npm install drizzle-orm postgres
npm install drizzle-kit --save-dev

# Redis and caching
npm install redis @types/redis

# Validation and utilities
npm install zod
npm install lodash @types/lodash

# File upload and processing
npm install multer @types/multer
npm install sharp  # Image processing

# Email services
npm install nodemailer @types/nodemailer

# WebSocket support
npm install ws @types/ws socket.io

# Monitoring and logging
npm install winston pino
npm install @sentry/nextjs  # Error tracking
```

### Environment Variables Setup
```bash
# Create environment files
touch .env.local .env.example .env.test

# .env.local (Development)
cat > .env.local << 'EOF'
# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/appcompatcheck
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=appcompatcheck
POSTGRES_USER=username
POSTGRES_PASSWORD=password

# Redis
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# Email (Optional - for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# External APIs
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
OPENAI_API_KEY=your-openai-api-key

# Monitoring
SENTRY_DSN=your-sentry-dsn
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
EOF
```

### Database Schema Setup with Drizzle
```typescript
// lib/db/schema.ts
import { relations } from 'drizzle-orm';
import {
  boolean,
  timestamp,
  text,
  integer,
  pgTable,
  uuid,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull().default('user'),
  organizationId: uuid('organization_id').references(() => organizations.id),
  emailVerified: boolean('email_verified').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
  orgIdx: index('users_org_idx').on(table.organizationId),
}));
```

## Database & Caching

### PostgreSQL Setup
```bash
# Using Docker (Recommended for development)
docker run --name appcompatcheck-postgres \
  -e POSTGRES_DB=appcompatcheck \
  -e POSTGRES_USER=username \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:15

# Or using Docker Compose
cat > docker-compose.dev.yml << 'EOF'
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: appcompatcheck
      POSTGRES_USER: username
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U username -d appcompatcheck"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

volumes:
  postgres_data:
  redis_data:
EOF

# Start services
docker-compose -f docker-compose.dev.yml up -d
```

### Database Migration Setup
```bash
# Drizzle configuration
cat > drizzle.config.ts << 'EOF'
import type { Config } from 'drizzle-kit';

export default {
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
EOF

# Run migrations
npm run db:generate  # Generate migration files
npm run db:migrate   # Apply migrations
npm run db:push      # Push schema changes (development)
npm run db:studio    # Open Drizzle Studio
```

### Redis Setup and Configuration
```bash
# Install Redis (Local installation)
# Ubuntu/Debian
sudo apt update && sudo apt install redis-server

# macOS
brew install redis
brew services start redis

# Windows (using WSL or Docker recommended)
# Use Docker as shown above

# Test Redis connection
redis-cli ping  # Should return PONG
```

## DevOps & Infrastructure

### Docker Configuration
```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image, copy all files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Kubernetes Deployment
```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: appcompatcheck
spec:
  replicas: 3
  selector:
    matchLabels:
      app: appcompatcheck
  template:
    metadata:
      labels:
        app: appcompatcheck
    spec:
      containers:
      - name: appcompatcheck
        image: appcompatcheck:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: redis-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### GitHub Actions CI/CD
```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  NODE_VERSION: '20'

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run lints
      run: |
        npm run lint
        npm run type-check
    
    - name: Run tests
      run: npm run test:ci
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
    
    - name: Build application
      run: npm run build
    
    - name: Run E2E tests
      run: npm run test:e2e
```

## Testing & Quality Assurance

### Testing Framework Setup
```bash
# Jest and Testing Library
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
npm install --save-dev jest-environment-jsdom

# Playwright for E2E testing
npm init playwright@latest

# Additional testing utilities
npm install --save-dev @testing-library/user-event
npm install --save-dev supertest @types/supertest  # API testing
npm install --save-dev artillery  # Performance testing
```

### Jest Configuration
```javascript
// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}

module.exports = createJestConfig(customJestConfig)
```

### ESLint and Prettier Configuration
```json
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "prefer-const": "error",
    "no-console": "warn"
  },
  "overrides": [
    {
      "files": ["*.test.ts", "*.test.tsx", "*.spec.ts", "*.spec.tsx"],
      "rules": {
        "@typescript-eslint/no-explicit-any": "off"
      }
    }
  ]
}
```

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

## Monitoring & Observability

### Application Monitoring Setup
```bash
# Install monitoring packages
npm install @sentry/nextjs
npm install winston pino
npm install @opentelemetry/api @opentelemetry/sdk-node

# Metrics and health checks
npm install prom-client
npm install express-rate-limit
```

### Sentry Configuration
```javascript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  debug: false,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
```

### Winston Logging Setup
```typescript
// lib/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'appcompatcheck' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export default logger;
```

## Third-party Integrations

### GitHub Integration Setup
```bash
# Install GitHub SDK
npm install @octokit/rest
npm install @octokit/webhooks

# Environment variables needed
# GITHUB_CLIENT_ID=your-github-app-client-id
# GITHUB_CLIENT_SECRET=your-github-app-client-secret
# GITHUB_WEBHOOK_SECRET=your-webhook-secret
```

### AI/ML Integration
```bash
# OpenAI integration
npm install openai

# Alternative AI services
npm install @google/generative-ai  # Google Gemini
npm install anthropic  # Claude
```

### Package Scripts Configuration
```json
// package.json scripts section
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:ci": "jest --ci --coverage --watchAll=false",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:performance": "artillery run artillery.yml",
    "db:generate": "drizzle-kit generate:pg",
    "db:migrate": "drizzle-kit push:pg",
    "db:studio": "drizzle-kit studio",
    "db:seed": "tsx lib/db/seed.ts",
    "docker:build": "docker build -t appcompatcheck .",
    "docker:run": "docker run -p 3000:3000 appcompatcheck",
    "k8s:deploy": "kubectl apply -f k8s/",
    "prepare": "husky install"
  }
}
```

### Pre-commit Hooks with Husky
```bash
# Install husky and lint-staged
npm install --save-dev husky lint-staged

# Initialize husky
npx husky install
npm pkg set scripts.prepare="husky install"

# Add pre-commit hook
npx husky add .husky/pre-commit "npx lint-staged"
```

```json
// package.json - lint-staged configuration
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,yml,yaml}": [
      "prettier --write"
    ]
  }
}
```

---

*This comprehensive setup guide ensures that all developers on the AppCompatCheck project have consistent development environments and tooling configurations, leading to better code quality and faster development cycles.*