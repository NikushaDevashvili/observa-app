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
4. Configure environment variable:
   - `NEXT_PUBLIC_API_URL` - Your production observa-api URL (e.g., https://observa-api.vercel.app)
5. Click "Deploy"

## Step 2: Verify Deployment

1. Visit your deployed URL (e.g., https://observa-app.vercel.app)
2. Test the signup flow
3. Verify API key generation works

## Environment Variables

- `NEXT_PUBLIC_API_URL` - Production observa-api URL (required)

