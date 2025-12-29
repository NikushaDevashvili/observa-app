# Observa App Deployment Guide

## Prerequisites

1. Vercel account
2. GitHub repository with observa-app code
3. Production observa-api URL

## Step 1: Deploy to Vercel

### Via GitHub Integration (Recommended)

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Vercel will auto-detect Next.js
4. Configure environment variables (see below)
5. Click "Deploy"

## Step 2: Verify Deployment

1. Visit your deployed URL (e.g., https://observa-app.vercel.app)
2. Test the signup flow
3. Verify API key generation works

## Environment Variables

### Required:
- `API_URL` - Your production observa-api URL (e.g., https://observa-api.vercel.app)
  - **Note:** This is server-side only and NOT exposed to the browser (more secure)

### Optional:
- `NEXT_PUBLIC_SENTRY_DSN` - Sentry DSN for client-side error tracking
- `SENTRY_DSN` - Sentry DSN for server-side error tracking
- `SENTRY_ORG` - Your Sentry organization slug
- `SENTRY_PROJECT` - Your Sentry project name

## Security Note

We use Next.js API routes as a proxy to hide the actual API URL from the browser. The client calls `/api/auth/login` (your Next.js server), which then calls the real API server-side. This keeps your API URL private and adds an extra security layer.


