# Execution Guide

## Table of Contents
- [Running the Application](#running-the-application)
- [Development Commands](#development-commands)
- [Testing Commands](#testing-commands)
- [Database Operations](#database-operations)
- [Build and Deployment](#build-and-deployment)
- [Monitoring and Logs](#monitoring-and-logs)
- [API Usage Examples](#api-usage-examples)
- [Common Workflows](#common-workflows)
- [Troubleshooting Commands](#troubleshooting-commands)

## Running the Application

### Quick Start
```bash
# Clone and setup the project
git clone https://github.com/sandysunny99/appcompatcheck.git
cd appcompatcheck

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your configuration

# Start database and Redis (using Docker)
docker-compose -f docker-compose.dev.yml up -d

# Run database migrations
npm run db:migrate

# Seed initial data
npm run db:seed

# Start development server
npm run dev
```

### Development Server
```bash
# Start development server (default port 3000)
npm run dev

# Start on custom port
PORT=3001 npm run dev

# Start with debug mode
DEBUG=* npm run dev

# Start with specific Node.js options
NODE_OPTIONS='--max-old-space-size=4096' npm run dev
```

### Production Server
```bash
# Build the application
npm run build

# Start production server
npm run start

# Start with PM2 (process manager)
pm2 start npm --name "appcompatcheck" -- start
pm2 save
pm2 startup
```

## Development Commands

### Code Quality and Formatting
```bash
# Lint code
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Check TypeScript types
npm run type-check

# Format code with Prettier
npm run format

# Check code formatting
npm run format:check

# Run all quality checks
npm run quality:check
```

### Git Hooks and Pre-commit
```bash
# Setup Git hooks with Husky
npm run prepare

# Run pre-commit checks manually
npx lint-staged

# Commit with conventional commits
npm run commit
# or
npx cz

# Validate commit messages
npx commitlint --edit $1
```

### File Watching and Hot Reload
```bash
# Start development with turbo mode
npm run dev:turbo

# Watch for file changes and rebuild
npm run watch

# Monitor file changes
npm run monitor
```

## Testing Commands

### Unit Testing
```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test auth.test.ts

# Run tests matching pattern
npm run test -- --testPathPattern=api

# Run tests in CI mode (no watch)
npm run test:ci

# Generate coverage report
npm run coverage:report
```

### End-to-End Testing
```bash
# Install Playwright browsers
npx playwright install

# Run all E2E tests
npm run test:e2e

# Run E2E tests in headed mode
npm run test:e2e:headed

# Run E2E tests with UI mode
npm run test:e2e:ui

# Run specific E2E test
npx playwright test auth.e2e.ts

# Run E2E tests on specific browser
npx playwright test --project=chromium

# Generate E2E test report
npx playwright show-report
```

### Integration Testing
```bash
# Run integration tests
npm run test:integration

# Run API tests
npm run test:api

# Test database operations
npm run test:db

# Test external integrations
npm run test:integrations
```

### Performance Testing
```bash
# Run performance tests with Artillery
npm run test:performance

# Run load testing
npm run test:load

# Run stress testing
npm run test:stress

# Generate performance report
npm run perf:report

# Lighthouse performance audit
npm run audit:lighthouse
```

## Database Operations

### Database Management
```bash
# Generate database schema
npm run db:generate

# Apply migrations
npm run db:migrate

# Rollback migration
npm run db:rollback

# Reset database (development only)
npm run db:reset

# Drop all tables and recreate
npm run db:fresh

# Seed database with sample data
npm run db:seed

# Clear all data
npm run db:clear
```

### Database Introspection
```bash
# Pull database schema
npm run db:pull

# Open Drizzle Studio (GUI)
npm run db:studio

# Generate database documentation
npm run db:docs

# Export database schema
npm run db:export

# Import database schema
npm run db:import backup.sql
```

### Database Backup and Restore
```bash
# Create database backup
npm run db:backup

# Create backup with timestamp
npm run db:backup:timestamp

# Restore from backup
npm run db:restore backup-2024-01-01.sql

# List available backups
npm run db:backups:list

# Clean old backups
npm run db:backups:clean
```

### Environment-Specific Database Commands
```bash
# Run migrations on staging
NODE_ENV=staging npm run db:migrate

# Seed production data (careful!)
NODE_ENV=production npm run db:seed:prod

# Backup production database
NODE_ENV=production npm run db:backup

# Test database connectivity
npm run db:test
```

## Build and Deployment

### Build Commands
```bash
# Build for production
npm run build

# Build with analysis
npm run build:analyze

# Build and export static files
npm run export

# Clean build artifacts
npm run clean

# Build Docker image
npm run docker:build

# Build and tag Docker image
docker build -t appcompatcheck:v1.0.0 .
```

### Deployment Commands
```bash
# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:production

# Deploy with Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# Deploy to Kubernetes
kubectl apply -f k8s/

# Check deployment status
kubectl rollout status deployment/appcompatcheck

# Scale deployment
kubectl scale deployment appcompatcheck --replicas=5
```

### CI/CD Pipeline Commands
```bash
# Trigger GitHub Actions workflow
gh workflow run ci-cd

# Check workflow status
gh run list

# View workflow logs
gh run view --log

# Manual deployment trigger
gh workflow run deploy --ref main
```

## Monitoring and Logs

### Application Logs
```bash
# View application logs
npm run logs

# View logs with specific level
npm run logs:error
npm run logs:warn
npm run logs:info

# Tail live logs
npm run logs:tail

# View logs for specific module
npm run logs:auth
npm run logs:api
```

### Docker Container Logs
```bash
# View all container logs
docker-compose logs

# View specific service logs
docker-compose logs app
docker-compose logs postgres
docker-compose logs redis

# Follow logs in real-time
docker-compose logs -f app

# View last 100 lines
docker-compose logs --tail=100 app
```

### Kubernetes Logs
```bash
# View pod logs
kubectl logs -f deployment/appcompatcheck

# View logs from all pods
kubectl logs -f -l app=appcompatcheck

# View previous pod logs
kubectl logs --previous deployment/appcompatcheck

# Stream logs from multiple pods
kubectl logs -f deployment/appcompatcheck --all-containers=true
```

### System Monitoring
```bash
# Check application health
curl http://localhost:3000/api/health

# Check system metrics
npm run metrics

# Monitor performance
npm run monitor:performance

# Check database connections
npm run monitor:db

# Check Redis connections
npm run monitor:redis
```

## API Usage Examples

### Authentication API
```bash
# Register new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword",
    "name": "John Doe"
  }'

# Login user
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword"
  }'

# Logout user
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Verify email
curl -X POST http://localhost:3000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "token": "verification_token_here"
  }'
```

### Scanning API
```bash
# Start new compatibility scan
curl -X POST http://localhost:3000/api/scans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "repositoryUrl": "https://github.com/user/repo",
    "scanType": "full",
    "options": {
      "includeDeprecated": true,
      "checkSecurity": true
    }
  }'

# Get scan results
curl -X GET http://localhost:3000/api/scans/SCAN_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# List user scans
curl -X GET http://localhost:3000/api/scans \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Cancel running scan
curl -X POST http://localhost:3000/api/scans/SCAN_ID/cancel \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Reports API
```bash
# Generate report
curl -X POST http://localhost:3000/api/reports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "scanId": "scan_id_here",
    "format": "pdf",
    "options": {
      "includeDetails": true,
      "includeRecommendations": true
    }
  }'

# Download report
curl -X GET http://localhost:3000/api/reports/REPORT_ID/download \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -o report.pdf

# List reports
curl -X GET http://localhost:3000/api/reports \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Organization API
```bash
# Get organization details
curl -X GET http://localhost:3000/api/organizations/current \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Update organization settings
curl -X PATCH http://localhost:3000/api/organizations/current \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Updated Organization Name",
    "settings": {
      "allowPublicReports": false,
      "maxScansPerMonth": 100
    }
  }'

# Invite user to organization
curl -X POST http://localhost:3000/api/organizations/current/invites \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "email": "newuser@example.com",
    "role": "developer"
  }'
```

## Common Workflows

### Development Workflow
```bash
#!/bin/bash
# daily-dev-setup.sh - Daily development setup script

echo "🚀 Starting daily development setup..."

# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Check for outdated packages
npm outdated

# Run database migrations
npm run db:migrate

# Start development services
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check health
curl -f http://localhost:3000/api/health || exit 1

# Start development server
echo "✅ Starting development server..."
npm run dev
```

### Feature Development Workflow
```bash
#!/bin/bash
# feature-development.sh - Feature development workflow

FEATURE_NAME=$1

if [ -z "$FEATURE_NAME" ]; then
  echo "Usage: ./feature-development.sh <feature-name>"
  exit 1
fi

echo "🔧 Setting up feature branch: $FEATURE_NAME"

# Create and switch to feature branch
git checkout -b feature/$FEATURE_NAME

# Run quality checks
npm run lint
npm run type-check
npm run test

echo "✅ Feature branch ready. Happy coding!"
echo "When done, run: npm run feature:complete $FEATURE_NAME"
```

### Code Review Workflow
```bash
#!/bin/bash
# code-review.sh - Pre-review checklist

echo "📋 Running pre-review checklist..."

# Format code
npm run format

# Fix linting issues
npm run lint:fix

# Run type check
npm run type-check

# Run tests
npm run test

# Build application
npm run build

# Generate test coverage
npm run test:coverage

echo "✅ Code review checklist complete!"
echo "Coverage report available at: coverage/lcov-report/index.html"
```

### Deployment Workflow
```bash
#!/bin/bash
# deploy.sh - Deployment workflow

ENVIRONMENT=$1

if [ -z "$ENVIRONMENT" ]; then
  echo "Usage: ./deploy.sh <staging|production>"
  exit 1
fi

echo "🚀 Deploying to $ENVIRONMENT..."

# Run pre-deployment checks
npm run lint
npm run test:ci
npm run build

# Build Docker image
docker build -t appcompatcheck:$ENVIRONMENT .

# Deploy based on environment
if [ "$ENVIRONMENT" = "staging" ]; then
  docker-compose -f docker-compose.staging.yml up -d
elif [ "$ENVIRONMENT" = "production" ]; then
  kubectl apply -f k8s/
  kubectl rollout status deployment/appcompatcheck
fi

# Health check
sleep 30
if [ "$ENVIRONMENT" = "staging" ]; then
  curl -f http://staging.appcompatcheck.com/api/health || exit 1
else
  curl -f https://appcompatcheck.com/api/health || exit 1
fi

echo "✅ Deployment to $ENVIRONMENT successful!"
```

### Database Migration Workflow
```bash
#!/bin/bash
# migrate.sh - Safe database migration workflow

echo "🗄️  Running database migration workflow..."

# Backup current database
echo "📦 Creating backup..."
npm run db:backup

# Run migrations
echo "⚡ Running migrations..."
npm run db:migrate

# Verify migration
echo "✅ Verifying migration..."
npm run db:test

# Seed data if needed
if [ "$1" = "--seed" ]; then
  echo "🌱 Seeding database..."
  npm run db:seed
fi

echo "✅ Database migration complete!"
```

## Troubleshooting Commands

### Application Issues
```bash
# Check application status
npm run health:check

# Debug mode start
DEBUG=* npm run dev

# Memory usage analysis
node --inspect npm run dev
# Then open chrome://inspect

# Profile performance
node --prof npm run start

# Analyze heap dump
node --inspect-brk npm run dev
```

### Database Issues
```bash
# Test database connection
npm run db:test

# Check database status
pg_isready -h localhost -p 5432 -U dev_user

# View active connections
npm run db:connections

# Kill long-running queries
npm run db:kill-queries

# Analyze slow queries
npm run db:slow-queries

# Rebuild indexes
npm run db:reindex
```

### Redis Issues
```bash
# Test Redis connection
redis-cli ping

# Check Redis memory usage
redis-cli info memory

# Monitor Redis commands
redis-cli monitor

# Clear Redis cache
redis-cli flushall

# Check Redis configuration
redis-cli config get "*"
```

### Docker Issues
```bash
# Check container status
docker-compose ps

# View container logs
docker-compose logs --tail=50 app

# Restart containers
docker-compose restart

# Clean up containers
docker-compose down -v
docker system prune -a

# Rebuild containers
docker-compose build --no-cache
docker-compose up -d
```

### Network Issues
```bash
# Check port availability
netstat -tulpn | grep 3000
lsof -i :3000

# Test API endpoints
curl -v http://localhost:3000/api/health

# Check DNS resolution
nslookup appcompatcheck.com
dig appcompatcheck.com

# Test SSL certificate
openssl s_client -connect appcompatcheck.com:443
```

### Performance Issues
```bash
# Monitor CPU and memory
top -p $(pgrep node)
htop

# Check disk usage
df -h
du -sh node_modules/

# Monitor network traffic
iotop
nethogs

# Profile application
npm run profile

# Analyze bundle size
npm run analyze
```

### Log Analysis
```bash
# Search for errors in logs
grep -i error logs/*.log

# Count error occurrences
grep -c "ERROR" logs/combined.log

# Monitor live logs
tail -f logs/combined.log | grep ERROR

# Analyze log patterns
awk '/ERROR/ {print $1, $2, $NF}' logs/combined.log

# Generate log summary
npm run logs:summary
```

### System Recovery
```bash
#!/bin/bash
# emergency-recovery.sh - Emergency recovery script

echo "🚨 Starting emergency recovery..."

# Stop all services
docker-compose down
pkill -f "npm run dev"

# Clean temporary files
rm -rf .next/
rm -rf node_modules/.cache/

# Reinstall dependencies
rm package-lock.json
npm install

# Reset database to last backup
npm run db:restore latest

# Restart services
docker-compose up -d

# Verify system health
sleep 30
npm run health:check

echo "✅ Emergency recovery complete!"
```

### Environment Validation
```bash
#!/bin/bash
# validate-env.sh - Environment validation script

echo "🔍 Validating environment..."

# Check Node.js version
NODE_VERSION=$(node -v)
echo "Node.js version: $NODE_VERSION"
if [[ ! "$NODE_VERSION" =~ v20\. ]]; then
  echo "❌ Node.js 20.x required"
  exit 1
fi

# Check npm version
NPM_VERSION=$(npm -v)
echo "npm version: $NPM_VERSION"

# Check environment variables
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL not set"
  exit 1
fi

if [ -z "$REDIS_URL" ]; then
  echo "❌ REDIS_URL not set"
  exit 1
fi

# Test database connection
if ! npm run db:test; then
  echo "❌ Database connection failed"
  exit 1
fi

# Test Redis connection
if ! redis-cli -u "$REDIS_URL" ping; then
  echo "❌ Redis connection failed"
  exit 1
fi

echo "✅ Environment validation passed!"
```

---

*This execution guide provides comprehensive command examples and workflows for all aspects of the AppCompatCheck application lifecycle, from development through production deployment and maintenance.*