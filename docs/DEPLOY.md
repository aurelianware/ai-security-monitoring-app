# Deployment Guide

## Prerequisites

- Node.js 20 or later
- npm 10 or later
- Azure account (optional, for cloud deployment)
- Domain name (optional)

## Local Development

### Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Configure OAuth providers (see README.md)
# Add NEXTAUTH_SECRET, Google OAuth, GitHub OAuth credentials

# Run development server
npm run dev
```

### Testing

```bash
# Run unit tests
npm run test

# Run linter
npm run lint

# Type checking
npm run type-check

# Security audit
npm run security:audit
```

## Production Deployment

### Build

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

### Deployment Options

#### Option 1: Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

Configuration:
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variables: Configure in Vercel dashboard

#### Option 2: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

Configuration:
- Build Command: `npm run build`
- Publish Directory: `dist`
- Environment Variables: Configure in Netlify dashboard

#### Option 3: Azure Static Web Apps

```bash
# Deploy via GitHub Actions
# See .github/workflows/azure-deploy.yml
```

Configuration:
- Use Azure Static Web Apps GitHub Action
- Configure app location: `/`
- Configure output location: `dist`
- Set environment variables in Azure Portal

### Database Setup

#### Development (SQLite)

```bash
# Initialize database
npx prisma migrate dev

# Open Prisma Studio
npx prisma studio
```

#### Production (PostgreSQL)

```bash
# Set DATABASE_URL in environment
export DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Run migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

### Environment Variables

Required for production:

- `NEXTAUTH_URL`: Full URL of your deployed app
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `GOOGLE_CLIENT_ID`: From Google Cloud Console
- `GOOGLE_CLIENT_SECRET`: From Google Cloud Console
- `GITHUB_ID`: From GitHub OAuth Apps
- `GITHUB_SECRET`: From GitHub OAuth Apps
- `DATABASE_URL`: PostgreSQL connection string
- `AZURE_STORAGE_ACCOUNT`: (Optional) Azure Storage account name
- `AZURE_STORAGE_SAS_TOKEN`: (Optional) Azure Storage SAS token

### SSL/TLS Configuration

- Vercel/Netlify: Automatic HTTPS
- Azure: Configure custom domain with SSL in portal
- Self-hosted: Use Let's Encrypt with certbot

### Domain Configuration

1. Point DNS to deployment provider
2. Configure custom domain in provider dashboard
3. Update OAuth redirect URIs
4. Update `NEXTAUTH_URL` environment variable

## Monitoring

### Application Monitoring

- Enable error tracking (Sentry, LogRocket)
- Monitor performance metrics
- Set up uptime monitoring

### Security Monitoring

- Enable GitHub security alerts
- Monitor Azure security center
- Review access logs regularly

## Rollback Procedure

1. Identify last known good deployment
2. Revert via provider dashboard or CLI
3. Verify functionality
4. Investigate and fix issue

## Scaling Considerations

- Use CDN for static assets
- Enable caching headers
- Consider serverless functions for API
- Implement rate limiting
- Use database connection pooling

## Troubleshooting

### Build Failures

- Check Node.js version (requires 20+)
- Verify all dependencies installed
- Check TypeScript errors: `npm run type-check`
- Review build logs

### Runtime Issues

- Check environment variables configured
- Verify database migrations applied
- Check browser console for errors
- Review application logs

### Authentication Issues

- Verify OAuth credentials
- Check redirect URIs match
- Ensure NEXTAUTH_URL is correct
- Verify HTTPS in production
