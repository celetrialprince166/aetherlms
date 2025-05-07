# AetherLMS Deployment Guide

This guide provides instructions for deploying AetherLMS to a production environment with special consideration for skipping database connections during the build process.

## Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Git
- Access to your database credentials for production

## Deployment Steps

### 1. Prepare Environment Variables

Create a `.env.local` file with all required environment variables. During the build process, the database connection will be automatically skipped.

```
# Database (will be skipped during build)
DATABASE_URL="your-production-database-url"

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
CLERK_SECRET_KEY=your_secret

# Other variables as needed
```

### 2. Build Options

You have several options for building the application:

#### Option 1: Safe Build Command

Use the included safe build command:

```bash
npm run build:safe
```

This will automatically skip database collection during build by setting the required environment variables.

#### Option 2: Full Deployment Script

Run the deployment script:

```bash
npm run deploy
```

This script:
1. Sets up a temporary environment optimized for building
2. Cleans previous build artifacts
3. Runs the build with data collection skipped
4. Prepares the output for deployment

#### Option 3: Manual Build with Environment Variables

You can also manually set the environment variables:

```bash
SKIP_DB_CHECK=true BUILD_MODE=static npm run build
```

### 3. Deploy the Built Application

After building, deploy the application to your hosting provider:

- For Vercel or Netlify: Connect your repository and use their CI/CD
- For custom servers: Copy the `out` directory to your server

### Troubleshooting

#### Build Errors

If you encounter build errors related to database connection:

1. Make sure `SKIP_DB_CHECK=true` is set in your environment
2. Check if `BUILD_MODE=static` is set correctly
3. Clear build cache with `npm run clean` or by removing the `.next` directory

#### Runtime Database Connection

Note that the application will still need valid database credentials at runtime. The skipping only applies to the build process.

## Important Configuration Files

- **next.config.js**: Contains build configuration
- **src/lib/build-safe-db.ts**: Handles database mocking during build
- **src/middleware.ts**: Configures dynamic routes

## Dynamic vs. Static Routes

Some routes in the application must be dynamic due to their usage of:
- Server-side cookies
- Headers
- Dynamic data fetching

These will show warnings during build but will work correctly at runtime.

## Need Help?

For additional help with deployment, contact the support team at support@aetherlms.com. 