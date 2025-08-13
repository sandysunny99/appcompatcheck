# AppCompatCheck

> Enterprise Compatibility Analysis Platform - AI-powered code scanning with comprehensive reporting and real-time monitoring.

[![Build Status](https://github.com/sandysunny99/appcompatcheck/workflows/CI/badge.svg)](https://github.com/sandysunny99/appcompatcheck/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6+-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.0+-black.svg)](https://nextjs.org/)

## 🚀 Features

### Core Functionality
- **AI-Powered Analysis**: Advanced machine learning algorithms for compatibility issue detection
- **Real-Time Scanning**: Live code analysis with WebSocket updates
- **Multi-Tenant Architecture**: Scalable organization-based data isolation
- **Enterprise Security**: JWT authentication, RBAC, and encrypted data transmission
- **Comprehensive Reporting**: Advanced analytics, trend analysis, and actionable insights
- **Integration Ecosystem**: GitHub, GitLab, Bitbucket, Jira, Slack, Teams, and webhook support

### Technical Features
- **Modern Stack**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Database**: PostgreSQL with Drizzle ORM
- **Caching**: Redis for session management and caching
- **Monitoring**: Prometheus, Grafana, and custom alerting
- **Testing**: Jest, Playwright, Artillery for comprehensive test coverage
- **Deployment**: Docker, Kubernetes, and CI/CD pipelines

## 📋 Prerequisites

- Node.js 18.17.0 or higher
- npm 9.0.0 or higher
- PostgreSQL 13+ (or Docker)
- Redis 6+ (or Docker)
- Git

## 🛠 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/sandysunny99/appcompatcheck.git
cd appcompatcheck
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Copy the example environment file and configure your variables:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/appcompatcheck"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT Secret
JWT_SECRET="your-secret-key-here"

# Email Configuration (optional for development)
SMTP_HOST="smtp.gmail.com"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
```

### 4. Database Setup

#### Using Docker (Recommended)

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Run database migrations
npm run db:migrate

# Seed the database (optional)
npm run db:seed
```

#### Manual Setup

```bash
# Create database
createdb appcompatcheck

# Run migrations
npm run db:migrate
```

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## 🏗 Project Structure

```
appcompatcheck/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── (auth)/           # Authentication pages
│   ├── dashboard/        # Dashboard pages
│   └── globals.css       # Global styles
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── dashboard/        # Dashboard-specific components
│   └── forms/            # Form components
├── lib/                   # Utility libraries
│   ├── db/               # Database configuration and schema
│   ├── auth/             # Authentication utilities
│   ├── scanning/         # Code scanning engines
│   └── utils.ts          # Common utilities
├── tests/                 # Test files
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── e2e/              # End-to-end tests
├── public/               # Static assets
├── docs/                 # Documentation
└── k8s/                  # Kubernetes manifests
```

## 🚦 Available Scripts

### Development
```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

### Testing
```bash
npm run test         # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:e2e     # Run end-to-end tests
npm run test:coverage # Generate test coverage report
npm run test:all     # Run all tests (lint, type-check, unit, e2e)
```

### Database
```bash
npm run db:migrate   # Run database migrations
npm run db:generate  # Generate migration files
npm run db:studio    # Open Drizzle Studio
npm run db:seed      # Seed database with sample data
```

### Docker & Deployment
```bash
npm run docker:build # Build Docker image
npm run docker:run   # Run with Docker Compose
npm run k8s:deploy   # Deploy to Kubernetes
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | JWT signing secret | Required |
| `SMTP_HOST` | Email server host | Required for email |
| `NEXT_PUBLIC_APP_URL` | Application URL | `http://localhost:3000` |

See `.env.example` for a complete list.

### Feature Flags

Enable/disable features using environment variables:

```env
FEATURE_AI_ANALYSIS=true
FEATURE_REAL_TIME_SCANNING=true
FEATURE_ADVANCED_REPORTING=true
FEATURE_INTEGRATIONS=true
```

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### Integration Tests
```bash
npm run test:integration
```

### End-to-End Tests
```bash
npm run test:e2e
```

### Performance Tests
```bash
npm run test:performance
```

## 🚀 Deployment

### Docker Deployment

1. Build the image:
```bash
docker build -t appcompatcheck .
```

2. Run with Docker Compose:
```bash
docker-compose up -d
```

### Kubernetes Deployment

1. Configure your cluster:
```bash
kubectl config use-context your-cluster
```

2. Deploy:
```bash
npm run k8s:deploy
```

### Environment-Specific Deployments

- **Development**: `docker-compose.dev.yml`
- **Staging**: `k8s/overlays/staging/`
- **Production**: `k8s/overlays/production/`

## 📊 Monitoring

### Health Checks

- Application: `GET /api/health`
- Database: `GET /api/health/database`
- Redis: `GET /api/health/redis`

### Metrics

Access metrics at:
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3001`

### Logging

Logs are available in:
- Development: Console output
- Production: `logs/application.log`
- Kubernetes: `kubectl logs -f deployment/appcompatcheck`

## 🔐 Security

### Authentication
- JWT-based authentication
- Role-based access control (RBAC)
- Email verification required
- Password strength validation

### Data Protection
- Encrypted data transmission (HTTPS)
- Secure HTTP-only cookies
- Rate limiting on API endpoints
- Input validation and sanitization

### Security Headers
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: origin-when-cross-origin
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Write tests for new features
- Use conventional commit messages
- Ensure code passes linting and type checks

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh tokens

### Scanning Endpoints
- `GET /api/scans` - List scans
- `POST /api/scans` - Create new scan
- `GET /api/scans/:id` - Get scan details
- `POST /api/scans/:id/cancel` - Cancel scan

### Organization Endpoints
- `GET /api/organizations` - List organizations
- `POST /api/organizations` - Create organization
- `PUT /api/organizations/:id` - Update organization

For complete API documentation, visit `/docs/api` when running the application.

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check if PostgreSQL is running
sudo service postgresql status

# Verify connection string
echo $DATABASE_URL
```

#### Redis Connection Errors
```bash
# Check if Redis is running
redis-cli ping

# Should return PONG
```

#### Build Errors
```bash
# Clear cache and reinstall
rm -rf .next node_modules package-lock.json
npm install
```

### Performance Issues

#### Slow Database Queries
- Check indexes are created: `npm run db:studio`
- Enable query logging in development
- Use database query optimization tools

#### Memory Issues
- Monitor with: `npm run monitoring:up`
- Check for memory leaks in long-running processes
- Optimize React component re-renders

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM
- [Radix UI](https://www.radix-ui.com/) - UI primitives
- [Lucide React](https://lucide.dev/) - Icon library

## 📞 Support

- **Documentation**: [docs.appcompatcheck.com](https://docs.appcompatcheck.com)
- **Issues**: [GitHub Issues](https://github.com/sandysunny99/appcompatcheck/issues)
- **Discussions**: [GitHub Discussions](https://github.com/sandysunny99/appcompatcheck/discussions)
- **Email**: support@appcompatcheck.com

---

**Made with ❤️ for developers who care about code quality.**