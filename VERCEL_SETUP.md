# 🚀 Vercel Setup Guide for AppCompatCheck

## Quick Start: Deploy in 5 Minutes

### Step 1: Push to GitHub ✅ (Already Done)

Your code is already at: `https://github.com/sandysunny99/appcompatcheck`

### Step 2: Connect to Vercel

1. **Visit** [vercel.com/new](https://vercel.com/new)
2. **Sign in** with your GitHub account
3. **Import** your repository: `sandysunny99/appcompatcheck`
4. **Configure** project settings (see below)
5. **Add** environment variables (see below)
6. **Deploy!**

---

## Project Configuration

When importing, use these settings:

```yaml
Framework Preset: Next.js
Root Directory: ./
Build Command: npm install --legacy-peer-deps && npm run build
Install Command: npm install --legacy-peer-deps
Output Directory: .next (automatic)
Node.js Version: 18.x
```

---

## Required Environment Variables

Copy these to Vercel Dashboard → Settings → Environment Variables:

### 🔒 Essential (Required for basic functionality)

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Authentication  
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=https://your-app.vercel.app
JWT_SECRET=generate-with-openssl-rand-base64-32

# Application
NODE_ENV=production
NPM_CONFIG_LEGACY_PEER_DEPS=true
```

### 📧 Email (Required for notifications)

**Option 1: Resend (Recommended)**
```bash
RESEND_API_KEY=re_your_api_key
EMAIL_FROM=noreply@your-domain.com
```

**Option 2: SMTP**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@your-domain.com
```

### ⚡ Optional (Recommended for production)

```bash
# Redis Cache
REDIS_URL=redis://your-redis-host:6379

# Admin Account
ADMIN_EMAIL=admin@your-domain.com
ADMIN_PASSWORD=SecurePassword123!

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_MONITORING=true
```

---

## Database Setup Options

### Option 1: Vercel Postgres (Easiest)

```bash
# In your terminal
vercel postgres create

# Copy the connection string to DATABASE_URL
```

###Option 2: Supabase (Free Tier)

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Copy connection string from Settings → Database
4. Use as DATABASE_URL

### Option 3: Railway

1. Go to [railway.app](https://railway.app)
2. Create PostgreSQL database
3. Copy connection string
4. Use as DATABASE_URL

### Option 4: Neon (Serverless)

1. Go to [neon.tech](https://neon.tech)
2. Create database
3. Copy connection string
4. Use as DATABASE_URL

---

## After First Deployment

### 1. Run Database Migrations

```bash
# Method 1: Using Vercel CLI
vercel env pull .env.local
npm run db:migrate

# Method 2: API endpoint (create this route)
curl -X POST https://your-app.vercel.app/api/admin/migrate
```

### 2. Create Admin User

```bash
# Method 1: Using environment variables (Automatic)
# Just set ADMIN_EMAIL and ADMIN_PASSWORD in Vercel

# Method 2: Using API
curl -X POST https://your-app.vercel.app/api/admin/setup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePassword123!",
    "name": "Admin User"
  }'
```

### 3. Test Your Deployment

Visit these URLs:
- Homepage: `https://your-app.vercel.app/`
- API Status: `https://your-app.vercel.app/api/simple-status`
- Login: `https://your-app.vercel.app/sign-in`

---

## Custom Domain Setup

### 1. Add Domain in Vercel

1. Go to: Project → Settings → Domains
2. Add your domain (e.g., `appcompatcheck.com`)
3. Vercel will provide DNS records

### 2. Configure DNS

Add these records to your domain provider:

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME  
Name: www
Value: cname.vercel-dns.com
```

### 3. Update Environment Variable

```bash
NEXTAUTH_URL=https://your-domain.com
```

### 4. SSL Certificate

✅ Automatically provisioned by Vercel (no action needed)

---

## Automatic Deployments

### Every Git Push = New Deployment

```bash
git add .
git commit -m "Your changes"
git push origin main
```

Vercel will automatically:
1. ✅ Detect the push
2. ✅ Run the build
3. ✅ Deploy to production
4. ✅ Send you a notification

### Preview Deployments

Every Pull Request gets its own preview URL:
- Automatically created
- Isolated environment
- Test before merging

---

## GitHub Actions Integration (Optional)

Already configured in `.github/workflows/deploy.yml`

### Required Secrets

Add to GitHub Settings → Secrets → Actions:

```bash
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id
```

Get these values:
```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Link project
vercel link

# 4. Get values from .vercel/project.json
cat .vercel/project.json
```

---

## Monitoring & Logs

### View Deployment Logs

1. Go to Vercel Dashboard
2. Click on your deployment
3. View build logs and runtime logs

### Real-time Logs

```bash
# Install Vercel CLI
npm install -g vercel

# View logs
vercel logs your-app.vercel.app --follow
```

### Error Tracking

Add Sentry for error tracking:
```bash
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
```

---

## Performance Optimization

### 1. Enable Analytics

```bash
# Vercel Analytics (Automatic)
# Just enable in Vercel Dashboard → Analytics

# Or add Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 2. Enable Caching

```bash
CACHE_ENABLED=true
CACHE_TTL=3600
```

### 3. Add Redis

```bash
# Upstash Redis (Free tier)
REDIS_URL=redis://your-redis-url
```

---

## Common Issues & Solutions

### Build Failing?

**Error: "Module not found"**
```bash
# Solution: Dependencies already fixed ✓
# Latest commit: de14dda
```

**Error: "Type errors"**
```bash
# Check build logs in Vercel Dashboard
# Run locally: npm run type-check
```

### Runtime Errors?

**"Internal Server Error"**
- ✅ Check environment variables are set
- ✅ Verify DATABASE_URL is correct
- ✅ Check Vercel logs for details

**Database Connection Issues**
```bash
# Test connection format:
# postgresql://user:password@host:5432/database

# Ensure no trailing slashes or extra characters
```

### Slow Performance?

- ✅ Add Redis caching (REDIS_URL)
- ✅ Enable Vercel Analytics
- ✅ Use Next.js Image optimization
- ✅ Enable ISR (Incremental Static Regeneration)

---

## Rollback Deployment

If something goes wrong:

1. Go to Vercel Dashboard → Deployments
2. Find the last working deployment
3. Click "⋯" → "Promote to Production"

Or via CLI:
```bash
vercel rollback
```

---

## Cost Estimation

### Vercel Pricing

**Hobby Plan (Free)**
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Serverless functions
- ✅ SSL certificates
- ✅ Preview deployments

**Pro Plan ($20/month)**
- ✅ Everything in Hobby
- ✅ Team collaboration
- ✅ Password protection
- ✅ Analytics
- ✅ Priority support

### Database Costs

**Vercel Postgres**
- Hobby: $0 (512MB)
- Pro: $10-$130/month

**Supabase**
- Free: 500MB
- Pro: $25/month

**Railway**
- Hobby: $5/month
- Team: $20/month

---

## Security Checklist

Before going to production:

- [ ] Environment variables are set
- [ ] Database has strong password
- [ ] NEXTAUTH_SECRET and JWT_SECRET are random
- [ ] Admin account has strong password
- [ ] CORS is configured (ALLOWED_ORIGINS)
- [ ] Rate limiting is enabled
- [ ] SSL certificate is active (automatic on Vercel)
- [ ] Sensitive data not in Git repository
- [ ] Database backups are configured
- [ ] Monitoring/error tracking is setup

---

## Support & Resources

### Documentation
- [Vercel Docs](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Full Deployment Guide](./DEPLOYMENT_GUIDE.md)

### Get Help
- 📧 Email: support@appcompatcheck.com
- 🐛 GitHub Issues: [Report Issue](https://github.com/sandysunny99/appcompatcheck/issues)
- 💬 Vercel Support: [support.vercel.com](https://vercel.com/support)

---

## Quick Command Reference

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link project
vercel link

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs

# Pull environment variables
vercel env pull

# Add environment variable
vercel env add DATABASE_URL

# Rollback
vercel rollback
```

---

**Ready to deploy? Let's go! 🚀**

1. Visit [vercel.com/new](https://vercel.com/new)
2. Import `sandysunny99/appcompatcheck`
3. Add environment variables
4. Click "Deploy"
5. Done! ✨

Your app will be live at `https://your-app.vercel.app` in ~2 minutes!
