# Environment Setup Guide

## Table of Contents
- [Development Environment](#development-environment)
- [Testing Environment](#testing-environment)
- [Staging Environment](#staging-environment)
- [Production Environment](#production-environment)
- [OS-Specific Setup Instructions](#os-specific-setup-instructions)
- [Environment Variables Configuration](#environment-variables-configuration)
- [Database Setup](#database-setup)
- [Security Configurations](#security-configurations)
- [Troubleshooting](#troubleshooting)

## Development Environment

### Prerequisites
- **Operating System**: Windows 10+, macOS 10.15+, Ubuntu 18.04+
- **Node.js**: 20.x LTS or higher
- **npm**: 9.x or higher
- **Git**: 2.30 or higher
- **Docker**: 20.10 or higher (optional but recommended)
- **Memory**: Minimum 8GB RAM (16GB recommended)
- **Storage**: Minimum 10GB free space

### Quick Setup (All Platforms)
```bash
# 1. Clone the repository
git clone https://github.com/sandysunny99/appcompatcheck.git
cd appcompatcheck

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env.local

# 4. Start development services (using Docker)
docker-compose -f docker-compose.dev.yml up -d

# 5. Run database migrations
npm run db:migrate

# 6. Seed initial data
npm run db:seed

# 7. Start development server
npm run dev
```

### Manual Development Setup

#### Step 1: Node.js Installation
```bash
# Using Node Version Manager (Recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
nvm alias default 20

# Verify installation
node --version  # Should output v20.x.x
npm --version   # Should output 10.x.x
```

#### Step 2: Database Setup (PostgreSQL)
```bash
# Option 1: Using Docker (Recommended for development)
docker run --name appcompatcheck-postgres \
  -e POSTGRES_DB=appcompatcheck_dev \
  -e POSTGRES_USER=dev_user \
  -e POSTGRES_PASSWORD=dev_password \
  -p 5432:5432 \
  -d postgres:15

# Option 2: Local PostgreSQL Installation
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql
brew services start postgresql

# Create database and user
sudo -u postgres psql
CREATE DATABASE appcompatcheck_dev;
CREATE USER dev_user WITH ENCRYPTED PASSWORD 'dev_password';
GRANT ALL PRIVILEGES ON DATABASE appcompatcheck_dev TO dev_user;
\q
```

#### Step 3: Redis Setup
```bash
# Option 1: Using Docker
docker run --name appcompatcheck-redis -p 6379:6379 -d redis:7-alpine

# Option 2: Local Redis Installation
# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis-server

# macOS
brew install redis
brew services start redis

# Test Redis connection
redis-cli ping  # Should return PONG
```

#### Step 4: Environment Configuration
```bash
# Create development environment file
cat > .env.local << 'EOF'
# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://dev_user:dev_password@localhost:5432/appcompatcheck_dev

# Redis Configuration
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=dev-jwt-secret-change-in-production
JWT_EXPIRES_IN=7d

# Email Configuration (Optional for development)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-dev-email@gmail.com
SMTP_PASSWORD=your-app-password

# External API Keys (Optional)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
OPENAI_API_KEY=your-openai-api-key

# Development Features
ENABLE_DEBUG_LOGS=true
DISABLE_RATE_LIMITING=true
EOF
```

#### Step 5: Start Development Server
```bash
# Install dependencies
npm install

# Generate database schema
npm run db:generate

# Apply migrations
npm run db:migrate

# Seed development data
npm run db:seed

# Start development server
npm run dev

# Server will be available at http://localhost:3000
```

### Development Tools Setup

#### VS Code Extensions
```bash
# Install recommended extensions
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension bradlc.vscode-tailwindcss
code --install-extension ms-playwright.playwright
code --install-extension esbenp.prettier-vscode
code --install-extension dbaeumer.vscode-eslint
code --install-extension ms-vscode.vscode-docker
```

#### Git Hooks Setup
```bash
# Install and setup Husky for pre-commit hooks
npm run prepare
npx husky add .husky/pre-commit "npx lint-staged"
npx husky add .husky/commit-msg "npx commitlint --edit \$1"
```

## Testing Environment

### Automated Testing Setup
```bash
# Install testing dependencies (if not already installed)
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
npm install --save-dev playwright @playwright/test

# Setup test database
createdb appcompatcheck_test

# Environment variables for testing
cat > .env.test << 'EOF'
NODE_ENV=test
DATABASE_URL=postgresql://dev_user:dev_password@localhost:5432/appcompatcheck_test
REDIS_URL=redis://localhost:6379/1
JWT_SECRET=test-jwt-secret
DISABLE_RATE_LIMITING=true
ENABLE_DEBUG_LOGS=false
EOF
```

### Test Database Setup
```bash
# Create and migrate test database
npm run db:migrate:test
npm run db:seed:test

# Run test suites
npm run test          # Unit tests
npm run test:e2e      # End-to-end tests
npm run test:ci       # All tests with coverage
```

### Performance Testing Environment
```bash
# Install performance testing tools
npm install --save-dev artillery lighthouse-cli

# Create performance test configuration
cat > artillery.yml << 'EOF'
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Load test"
scenarios:
  - name: "API endpoints"
    requests:
      - get:
          url: "/api/health"
      - post:
          url: "/api/auth/login"
          json:
            email: "test@example.com"
            password: "password123"
EOF

# Run performance tests
npm run test:performance
```

## Staging Environment

### Staging Infrastructure Setup
```bash
# Docker Compose for staging environment
cat > docker-compose.staging.yml << 'EOF'
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: staging
      DATABASE_URL: postgresql://staging_user:staging_pass@postgres:5432/appcompatcheck_staging
      REDIS_URL: redis://redis:6379
      JWT_SECRET: staging-jwt-secret-change-this
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: appcompatcheck_staging
      POSTGRES_USER: staging_user
      POSTGRES_PASSWORD: staging_pass
    volumes:
      - staging_postgres:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - staging_redis:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.staging.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  staging_postgres:
  staging_redis:
EOF
```

### Staging Environment Variables
```bash
# .env.staging
cat > .env.staging << 'EOF'
NODE_ENV=staging
NEXT_PUBLIC_APP_URL=https://staging.appcompatcheck.com
NEXT_PUBLIC_API_URL=https://staging.appcompatcheck.com/api

DATABASE_URL=postgresql://staging_user:staging_pass@postgres:5432/appcompatcheck_staging
REDIS_URL=redis://redis:6379

JWT_SECRET=staging-jwt-secret-make-this-secure
JWT_EXPIRES_IN=7d

SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key

GITHUB_CLIENT_ID=your-staging-github-client-id
GITHUB_CLIENT_SECRET=your-staging-github-client-secret

SENTRY_DSN=your-staging-sentry-dsn
SENTRY_ENVIRONMENT=staging

ENABLE_DEBUG_LOGS=false
RATE_LIMIT_ENABLED=true
EOF
```

### Deploy to Staging
```bash
# Build and deploy to staging
docker-compose -f docker-compose.staging.yml build
docker-compose -f docker-compose.staging.yml up -d

# Run migrations on staging
docker-compose -f docker-compose.staging.yml exec app npm run db:migrate

# Health check
curl -f http://localhost:3000/api/health || exit 1
```

## Production Environment

### Production Infrastructure Requirements
- **Server**: Minimum 4 CPU cores, 16GB RAM, 100GB SSD
- **Database**: PostgreSQL 15+ with replication
- **Cache**: Redis cluster or managed service
- **Load Balancer**: Nginx or cloud load balancer
- **SSL Certificate**: Valid TLS certificate
- **Monitoring**: Application and infrastructure monitoring
- **Backup**: Automated database and file backups

### Kubernetes Production Deployment
```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: appcompatcheck-prod

---
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: appcompatcheck-prod
type: Opaque
data:
  database-url: # base64 encoded DATABASE_URL
  redis-url: # base64 encoded REDIS_URL
  jwt-secret: # base64 encoded JWT_SECRET

---
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: appcompatcheck
  namespace: appcompatcheck-prod
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
        - name: NODE_ENV
          value: "production"
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
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
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

---
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: appcompatcheck-service
  namespace: appcompatcheck-prod
spec:
  selector:
    app: appcompatcheck
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP

---
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: appcompatcheck-ingress
  namespace: appcompatcheck-prod
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  tls:
  - hosts:
    - appcompatcheck.com
    - www.appcompatcheck.com
    secretName: appcompatcheck-tls
  rules:
  - host: appcompatcheck.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: appcompatcheck-service
            port:
              number: 80
```

### Production Environment Variables
```bash
# .env.production (managed through Kubernetes secrets)
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://appcompatcheck.com
NEXT_PUBLIC_API_URL=https://appcompatcheck.com/api

DATABASE_URL=postgresql://prod_user:secure_password@db-cluster:5432/appcompatcheck_prod
REDIS_URL=redis://redis-cluster:6379

JWT_SECRET=super-secure-jwt-secret-64-characters-long-random-string-here
JWT_EXPIRES_IN=7d

SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-production-sendgrid-api-key

GITHUB_CLIENT_ID=your-production-github-client-id
GITHUB_CLIENT_SECRET=your-production-github-client-secret

SENTRY_DSN=your-production-sentry-dsn
SENTRY_ENVIRONMENT=production

ENABLE_DEBUG_LOGS=false
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000

SSL_REDIRECT=true
TRUST_PROXY=true
```

### Production Deployment Commands
```bash
# Build production image
docker build -t appcompatcheck:latest .

# Deploy to Kubernetes
kubectl apply -f k8s/

# Monitor deployment
kubectl rollout status deployment/appcompatcheck -n appcompatcheck-prod

# View logs
kubectl logs -f deployment/appcompatcheck -n appcompatcheck-prod

# Scale deployment
kubectl scale deployment appcompatcheck --replicas=5 -n appcompatcheck-prod
```

## OS-Specific Setup Instructions

### Windows 10/11 Setup

#### Prerequisites Installation
```powershell
# Install Chocolatey (Package Manager)
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install Node.js, Git, and Docker
choco install nodejs git docker-desktop

# Install Windows Subsystem for Linux (WSL2) - Recommended
wsl --install

# Restart and setup WSL2
wsl --set-default-version 2
```

#### Windows-Specific Environment Setup
```powershell
# Clone repository
git clone https://github.com/sandysunny99/appcompatcheck.git
cd appcompatcheck

# Set environment variables (PowerShell)
$env:DATABASE_URL="postgresql://dev_user:dev_password@localhost:5432/appcompatcheck_dev"
$env:REDIS_URL="redis://localhost:6379"

# Or create .env.local file using PowerShell
@"
DATABASE_URL=postgresql://dev_user:dev_password@localhost:5432/appcompatcheck_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-jwt-secret
"@ | Out-File -FilePath .env.local -Encoding UTF8

# Install dependencies and start
npm install
npm run dev
```

### macOS Setup

#### Prerequisites Installation
```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js, Git, PostgreSQL, Redis
brew install node git postgresql redis

# Install Docker Desktop
brew install --cask docker

# Start services
brew services start postgresql
brew services start redis
```

#### macOS-Specific Configuration
```bash
# Create database user
createuser -s dev_user
createdb -O dev_user appcompatcheck_dev

# Setup environment
export DATABASE_URL="postgresql://dev_user@localhost:5432/appcompatcheck_dev"
export REDIS_URL="redis://localhost:6379"

# Add to ~/.zshrc or ~/.bash_profile for persistence
echo 'export DATABASE_URL="postgresql://dev_user@localhost:5432/appcompatcheck_dev"' >> ~/.zshrc
echo 'export REDIS_URL="redis://localhost:6379"' >> ~/.zshrc
```

### Ubuntu/Debian Setup

#### Prerequisites Installation
```bash
# Update package list
sudo apt update && sudo apt upgrade -y

# Install Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL and Redis
sudo apt install postgresql postgresql-contrib redis-server

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Start services
sudo systemctl start postgresql
sudo systemctl start redis-server
sudo systemctl enable postgresql
sudo systemctl enable redis-server
```

#### Ubuntu-Specific Database Setup
```bash
# Setup PostgreSQL user and database
sudo -u postgres createuser --interactive dev_user
sudo -u postgres createdb -O dev_user appcompatcheck_dev

# Set password for database user
sudo -u postgres psql
ALTER USER dev_user PASSWORD 'dev_password';
\q

# Test connection
psql -h localhost -U dev_user -d appcompatcheck_dev
```

### CentOS/RHEL Setup

#### Prerequisites Installation
```bash
# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Install PostgreSQL
sudo yum install -y postgresql-server postgresql-contrib
sudo postgresql-setup initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Install Redis
sudo yum install -y epel-release
sudo yum install -y redis
sudo systemctl start redis
sudo systemctl enable redis

# Install Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io
sudo systemctl start docker
sudo systemctl enable docker
```

## Environment Variables Configuration

### Environment Variable Templates

#### Development (.env.local)
```bash
# Application
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Database
DATABASE_URL=postgresql://dev_user:dev_password@localhost:5432/appcompatcheck_dev

# Redis
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=development-jwt-secret-change-this
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=10

# Email (Development - Optional)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-user
SMTP_PASSWORD=your-mailtrap-password

# External APIs (Development)
GITHUB_CLIENT_ID=your-dev-github-client-id
GITHUB_CLIENT_SECRET=your-dev-github-client-secret
OPENAI_API_KEY=your-openai-api-key

# Development Features
ENABLE_DEBUG_LOGS=true
DISABLE_RATE_LIMITING=true
ENABLE_API_DOCS=true
```

#### Testing (.env.test)
```bash
NODE_ENV=test
DATABASE_URL=postgresql://dev_user:dev_password@localhost:5432/appcompatcheck_test
REDIS_URL=redis://localhost:6379/1
JWT_SECRET=test-jwt-secret
BCRYPT_ROUNDS=4
DISABLE_RATE_LIMITING=true
ENABLE_DEBUG_LOGS=false
```

#### Production (.env.production)
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://appcompatcheck.com
NEXT_PUBLIC_API_URL=https://appcompatcheck.com/api

DATABASE_URL=postgresql://prod_user:secure_prod_password@prod-db:5432/appcompatcheck_prod
REDIS_URL=redis://prod-redis:6379

JWT_SECRET=production-super-secure-jwt-secret-64-chars-minimum
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-production-sendgrid-api-key

GITHUB_CLIENT_ID=your-production-github-client-id
GITHUB_CLIENT_SECRET=your-production-github-client-secret

SENTRY_DSN=your-production-sentry-dsn
SENTRY_ENVIRONMENT=production

ENABLE_DEBUG_LOGS=false
RATE_LIMIT_ENABLED=true
SSL_REDIRECT=true
TRUST_PROXY=true
```

### Environment Validation
```typescript
// lib/env.ts - Environment validation
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

export const env = envSchema.parse(process.env);
```

## Database Setup

### PostgreSQL Configuration

#### Development Database Setup
```sql
-- Create development database and user
CREATE DATABASE appcompatcheck_dev;
CREATE USER dev_user WITH ENCRYPTED PASSWORD 'dev_password';
GRANT ALL PRIVILEGES ON DATABASE appcompatcheck_dev TO dev_user;

-- Grant schema permissions
\c appcompatcheck_dev
GRANT ALL ON SCHEMA public TO dev_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dev_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dev_user;
```

#### Production Database Configuration
```sql
-- postgresql.conf settings for production
max_connections = 200
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
```

### Database Migration Management
```bash
# Generate new migration
npm run db:generate

# Apply migrations
npm run db:migrate

# Reset database (development only)
npm run db:reset

# Seed database with initial data
npm run db:seed

# Backup database
pg_dump -h localhost -U dev_user appcompatcheck_dev > backup.sql

# Restore database
psql -h localhost -U dev_user appcompatcheck_dev < backup.sql
```

## Security Configurations

### SSL/TLS Setup
```nginx
# nginx.conf - SSL configuration
server {
    listen 443 ssl http2;
    server_name appcompatcheck.com www.appcompatcheck.com;

    ssl_certificate /etc/ssl/certs/appcompatcheck.crt;
    ssl_certificate_key /etc/ssl/private/appcompatcheck.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    location / {
        proxy_pass http://app:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Firewall Configuration
```bash
# Ubuntu UFW setup
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw deny 5432  # Block direct database access
sudo ufw deny 6379  # Block direct Redis access
```

### Security Headers
```typescript
// next.config.js - Security headers
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}
```

## Troubleshooting

### Common Issues and Solutions

#### Node.js Version Issues
```bash
# Problem: Wrong Node.js version
# Solution: Use Node Version Manager
nvm install 20
nvm use 20
nvm alias default 20

# Verify
node --version  # Should be v20.x.x
```

#### Database Connection Issues
```bash
# Problem: Cannot connect to PostgreSQL
# Solution 1: Check if PostgreSQL is running
sudo systemctl status postgresql

# Solution 2: Check PostgreSQL configuration
sudo nano /etc/postgresql/15/main/postgresql.conf
# Ensure: listen_addresses = 'localhost'

sudo nano /etc/postgresql/15/main/pg_hba.conf
# Add: local all all md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

#### Redis Connection Issues
```bash
# Problem: Cannot connect to Redis
# Solution: Check Redis status and configuration
sudo systemctl status redis
redis-cli ping  # Should return PONG

# If Redis is not responding
sudo systemctl restart redis
```

#### Port Already in Use
```bash
# Problem: Port 3000 is already in use
# Solution 1: Find and kill the process
lsof -ti:3000 | xargs kill -9

# Solution 2: Use different port
PORT=3001 npm run dev
```

#### Permission Issues (Linux/macOS)
```bash
# Problem: Permission denied errors
# Solution: Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

# Or use npm prefix for local installations
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

#### Docker Issues
```bash
# Problem: Docker containers not starting
# Solution 1: Check Docker daemon
sudo systemctl status docker
sudo systemctl start docker

# Solution 2: Reset Docker containers
docker-compose down -v
docker system prune -a
docker-compose up -d

# Solution 3: Check logs
docker-compose logs app
docker-compose logs postgres
```

#### Build Issues
```bash
# Problem: Build fails with TypeScript errors
# Solution 1: Clear Next.js cache
rm -rf .next
npm run build

# Solution 2: Update dependencies
npm update
npm audit fix

# Solution 3: Check TypeScript configuration
npx tsc --noEmit
```

### Environment-Specific Troubleshooting

#### Windows-Specific Issues
```powershell
# Problem: Line ending issues
# Solution: Configure Git to handle line endings
git config --global core.autocrlf true

# Problem: PowerShell execution policy
# Solution: Set execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### macOS-Specific Issues
```bash
# Problem: Xcode command line tools missing
# Solution: Install Xcode tools
xcode-select --install

# Problem: Homebrew permissions
# Solution: Fix Homebrew permissions
sudo chown -R $(whoami) /usr/local/Homebrew
```

#### Linux-Specific Issues
```bash
# Problem: Node.js repository issues
# Solution: Clean and re-add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get update
sudo apt-get install -y nodejs

# Problem: PostgreSQL locale issues
# Solution: Set proper locale
sudo locale-gen en_US.UTF-8
sudo dpkg-reconfigure locales
```

### Health Check Commands
```bash
# System health check script
#!/bin/bash
echo "=== AppCompatCheck Environment Health Check ==="

# Node.js
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"

# Database connectivity
echo "Testing PostgreSQL connection..."
pg_isready -h localhost -p 5432 -U dev_user && echo "✅ PostgreSQL connected" || echo "❌ PostgreSQL connection failed"

# Redis connectivity
echo "Testing Redis connection..."
redis-cli ping > /dev/null && echo "✅ Redis connected" || echo "❌ Redis connection failed"

# Application health
echo "Testing application health..."
curl -f http://localhost:3000/api/health > /dev/null && echo "✅ Application healthy" || echo "❌ Application health check failed"

# Environment variables
echo "Checking environment variables..."
[ -f .env.local ] && echo "✅ Environment file exists" || echo "❌ Environment file missing"

echo "=== Health Check Complete ==="
```

---

*This comprehensive environment setup guide ensures consistent deployment across all environments and platforms, with detailed troubleshooting information to resolve common issues quickly.*