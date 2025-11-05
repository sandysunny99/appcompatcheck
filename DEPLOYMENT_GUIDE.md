# 🚀 AppCompatCheck - Deployment Guide

Complete guide for hosting AppCompatCheck from GitHub to various platforms.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Platform-Specific Deployment](#platform-specific-deployment)
   - [Vercel (Recommended)](#vercel-recommended)
   - [Netlify](#netlify)
   - [AWS Amplify](#aws-amplify)
   - [Docker/Self-Hosted](#dockerself-hosted)
3. [Environment Variables](#environment-variables)
4. [Database Setup](#database-setup)
5. [Post-Deployment Configuration](#post-deployment-configuration)
6. [Troubleshooting](#troubleshooting)

---

## 📦 Prerequisites

### Required Software
- **Node.js**: v18.17.0 or higher
- **npm**: v9.0.0 or higher
- **Git**: Latest version

### Required Services
- **PostgreSQL Database**: v14 or higher
- **Redis Cache**: v6 or higher (optional but recommended)
- **Email Service**: Resend, SendGrid, or SMTP

### GitHub Repository Setup
Ensure your code is pushed to GitHub:
```bash
git remote -v
# Should show: origin  https://github.com/sandysunny99/appcompatcheck.git
```

---

## 🌐 Platform-Specific Deployment

### Vercel (Recommended)

#### Why Vercel?
- ✅ Best Next.js integration
- ✅ Automatic deployments from GitHub
- ✅ Global CDN and edge functions
- ✅ Free tier available

#### Setup Steps

**1. Install Vercel CLI (Optional)**
```bash
npm install -g vercel
```

**2. Connect GitHub Repository**

Visit: https://vercel.com/new

1. Click "Import Project"
2. Select "Import Git Repository"
3. Choose `sandysunny99/appcompatcheck`
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: `npm install --legacy-peer-deps && npm run build`
   - **Install Command**: `npm install --legacy-peer-deps`
   - **Output Directory**: .next

**3. Configure Environment Variables** (See [Environment Variables](#environment-variables) section)

**4. Deploy**
- Click "Deploy"
- Vercel will automatically deploy on every push to `main`

#### Vercel Configuration File

The `vercel.json` is already configured:
```json
{
  "buildCommand": "npm install --legacy-peer-deps && npm run build",
  "installCommand": "npm install --legacy-peer-deps",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NPM_CONFIG_LEGACY_PEER_DEPS": "true"
  }
}
```

#### GitHub Actions Integration

Set up GitHub secrets for automated deployment:

1. Get your Vercel tokens:
   ```bash
   vercel login
   vercel link
   ```

2. Add these secrets to GitHub (Settings → Secrets → Actions):
   - `VERCEL_TOKEN`: Your Vercel API token
   - `VERCEL_ORG_ID`: From `.vercel/project.json`
   - `VERCEL_PROJECT_ID`: From `.vercel/project.json`

---

### Netlify

**1. Connect Repository**
- Visit: https://app.netlify.com/start
- Choose GitHub and select your repository

**2. Build Settings**
```yaml
Build command: npm run build
Publish directory: .next
```

**3. Configure Build Environment**
```bash
NPM_CONFIG_LEGACY_PEER_DEPS=true
NODE_VERSION=18
```

**4. Add `netlify.toml`**
```toml
[build]
  command = "npm install --legacy-peer-deps && npm run build"
  publish = ".next"

[build.environment]
  NPM_CONFIG_LEGACY_PEER_DEPS = "true"
  NODE_VERSION = "18"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

---

### AWS Amplify

**1. Connect Repository**
- Open AWS Amplify Console
- Click "New app" → "Host web app"
- Connect your GitHub repository

**2. Build Settings**
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install --legacy-peer-deps
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

**3. Environment Variables**
Add all required environment variables in the Amplify console

---

### Docker/Self-Hosted

**1. Build Docker Image**
```bash
docker build -t appcompatcheck:latest .
```

**2. Run Container**
```bash
docker run -d \
  -p 3000:3000 \
  --env-file .env.production \
  --name appcompatcheck \
  appcompatcheck:latest
```

**3. Using Docker Compose**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

**4. Kubernetes Deployment**
```bash
kubectl apply -f k8s/
```

---

## 🔐 Environment Variables

### Required Variables

Create these in your deployment platform:

#### Database & Cache
```bash
# PostgreSQL Database (REQUIRED)
DATABASE_URL=postgresql://username:password@host:5432/database_name

# Redis Cache (OPTIONAL - Recommended for production)
REDIS_URL=redis://host:6379
```

#### Authentication & Security
```bash
# JWT & Session Secrets (REQUIRED)
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
NEXTAUTH_URL=https://your-domain.com
JWT_SECRET=<generate-with-openssl-rand-base64-32>

# Admin Credentials (Initial Setup)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=<secure-password>
```

#### Email Service (Required for notifications)
```bash
# Option 1: Resend (Recommended)
RESEND_API_KEY=re_your_api_key
EMAIL_FROM=noreply@your-domain.com

# Option 2: SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@your-domain.com
```

#### External Integrations (Optional)
```bash
# GitHub Integration
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# GitLab Integration
GITLAB_CLIENT_ID=your_gitlab_client_id
GITLAB_CLIENT_SECRET=your_gitlab_client_secret

# Slack Integration
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret
```

#### Application Configuration
```bash
# Environment
NODE_ENV=production

# Build Configuration
NPM_CONFIG_LEGACY_PEER_DEPS=true
NEXT_TELEMETRY_DISABLED=1

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_MONITORING=true
```

### Generating Secrets

Generate secure secrets using:
```bash
# Generate JWT secret
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 🗄️ Database Setup

### 1. Create PostgreSQL Database

**Vercel Postgres** (Recommended for Vercel deployments)
```bash
vercel postgres create
```

**Supabase** (Free tier available)
1. Visit: https://supabase.com
2. Create new project
3. Copy connection string from Settings → Database

**Railway** (Alternative)
1. Visit: https://railway.app
2. Create PostgreSQL database
3. Copy connection string

**Neon** (Serverless PostgreSQL)
1. Visit: https://neon.tech
2. Create database
3. Copy connection string

### 2. Run Database Migrations

**After deployment**, run migrations:

```bash
# Using Vercel CLI
vercel env pull .env.local
npm run db:migrate

# Or via API call to your deployment
curl -X POST https://your-app.vercel.app/api/admin/migrations \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 3. Seed Initial Data

```bash
npm run db:seed
```

---

## 🔧 Post-Deployment Configuration

### 1. Verify Deployment

Check these endpoints:
- ✅ Homepage: `https://your-app.vercel.app/`
- ✅ API Status: `https://your-app.vercel.app/api/simple-status`
- ✅ Health Check: `https://your-app.vercel.app/api/monitoring/health`

### 2. Create Admin User

```bash
# Using the API
curl -X POST https://your-app.vercel.app/api/admin/setup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePassword123!",
    "name": "Admin User"
  }'

# Or use the script
node scripts/create-admin.js
```

### 3. Configure Custom Domain (Vercel)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Configure DNS:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

### 4. Set up SSL Certificate

Vercel automatically provisions SSL certificates. For custom hosting:
```bash
# Using Let's Encrypt
certbot --nginx -d your-domain.com -d www.your-domain.com
```

### 5. Configure Monitoring

Add monitoring services:
- **Sentry**: Error tracking
- **LogRocket**: Session replay
- **Vercel Analytics**: Built-in analytics

---

## 🐛 Troubleshooting

### Build Failures

**Error: "Module not found"**
```bash
# Solution: Ensure all dependencies are installed
npm install --legacy-peer-deps
```

**Error: "Duplicate export"**
```bash
# Already fixed in commit de14dda
# Pull latest changes: git pull origin main
```

**Error: "Type errors"**
```bash
# Check TypeScript errors
npm run type-check

# Fix and rebuild
npm run build
```

### Runtime Errors

**Error: "Internal Server Error"**
- Check environment variables are set
- Verify database connection
- Check application logs in Vercel Dashboard

**Database Connection Issues**
```bash
# Test database connection
psql $DATABASE_URL

# Check connection string format
# Should be: postgresql://user:pass@host:5432/dbname
```

**Redis Connection Issues**
```bash
# Redis is optional - app will work without it
# But set REDIS_URL for better performance
```

### Performance Issues

**Slow Page Loads**
- Enable CDN caching
- Optimize images with Next.js Image component
- Enable ISR (Incremental Static Regeneration)

**High Memory Usage**
- Increase Node.js memory limit:
  ```bash
  NODE_OPTIONS=--max-old-space-size=4096
  ```

---

## 📚 Additional Resources

### Documentation
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Actions](https://docs.github.com/en/actions)

### Support
- 📧 Email: support@appcompatcheck.com
- 💬 Discord: [Join our community](#)
- 🐛 Issues: [GitHub Issues](https://github.com/sandysunny99/appcompatcheck/issues)

---

## ✅ Deployment Checklist

- [ ] Repository pushed to GitHub
- [ ] Environment variables configured
- [ ] Database created and connection string added
- [ ] Email service configured
- [ ] Build successful locally (`npm run build`)
- [ ] Deployment platform connected to GitHub
- [ ] First deployment successful
- [ ] Database migrations run
- [ ] Admin user created
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] Monitoring tools integrated
- [ ] Error tracking configured
- [ ] Backup strategy implemented

---

**Congratulations! 🎉 Your AppCompatCheck application is now deployed and ready for use!**

For questions or issues, please open a GitHub issue or contact support.
