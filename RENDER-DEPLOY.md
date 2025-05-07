# Deploying AetherLMS to Render

This guide provides step-by-step instructions for deploying AetherLMS to [Render](https://render.com/), a cloud application hosting service.

## Prerequisites

- A Render account
- Your project pushed to a Git repository (GitHub, GitLab, etc.)
- A database connection string (Postgres) - Render offers managed PostgreSQL databases

## Deployment Steps

### 1. Create a PostgreSQL Database on Render (Optional)

If you don't already have a PostgreSQL database:

1. Log in to your Render dashboard
2. Click on "New +" and select "PostgreSQL"
3. Configure your database settings:
   - Name: `aetherlms-db` (or your preferred name)
   - Choose a region close to your users
   - Select the appropriate database plan
4. Click "Create Database"
5. Once created, note the "External Database URL" - you'll need this for your environment variables

### 2. Deploy the Web Service

#### Option 1: Using the Render Dashboard

1. Log in to your Render dashboard
2. Click on "New +" and select "Web Service"
3. Connect your Git repository
4. Configure your service:
   - Name: `aetherlms` (or your preferred name)
   - Runtime: `Node`
   - Build Command: `npm install && npm run build:safe`
   - Start Command: `npm run start`
5. Add the following environment variables:
   - `NODE_ENV`: `production`
   - `SKIP_DB_CHECK`: `true`
   - `BUILD_MODE`: `static`
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key
   - `CLERK_SECRET_KEY`: Your Clerk secret key
   - Add any other required environment variables
6. Click "Create Web Service"

#### Option 2: Using render.yaml (Blueprint)

1. We've already created a `render.yaml` file in your project
2. Push this file to your Git repository
3. In Render dashboard, click "New +" and select "Blueprint"
4. Connect your Git repository
5. Render will automatically detect the `render.yaml` file and configure services
6. Review the settings and add any secret environment variables
7. Click "Apply" to create all resources

### 3. Configure Database Connection

Make sure your `DATABASE_URL` environment variable is properly set in your Render service.

If using a Render-managed PostgreSQL database, the connection string format will be:
```
postgres://username:password@host:port/database
```

### 4. Connect Clerk Authentication

Ensure your Clerk authentication is properly configured by setting:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

Also, update your Clerk application settings to add your Render domain to the allowed domains.

### 5. Monitor Deployment

Once deployed:
1. Monitor the build logs for any issues
2. Check the application logs after deployment
3. Test your application thoroughly once it's live

### Troubleshooting

#### Build Failures

If your build fails:
1. Check the build logs for specific errors
2. Ensure all required environment variables are set
3. Verify that database mock is working during build (look for "[Database] Using MOCK database client" in logs)

#### Runtime Errors

If your app deploys but doesn't run correctly:
1. Check application logs in the Render dashboard
2. Verify database connection is working
3. Ensure Clerk authentication is properly configured

#### Port Binding Issues

If you see port binding errors:
1. Verify the `start` script in `package.json` is using the PORT environment variable
2. Render automatically sets the PORT variable, but our script defaults to 3000 if not set

## Scaling and Advanced Configuration

Refer to Render's documentation for:
- Setting up auto-scaling
- Configuring custom domains and SSL
- Setting up preview environments
- Implementing CI/CD pipelines

For additional help, contact the support team at support@aetherlms.com. 