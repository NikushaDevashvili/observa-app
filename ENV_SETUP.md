# Environment Variables Setup for observa-app

## 🔒 Security-First Approach

We use **Next.js API route proxies** to hide your API URL from the browser. This is more secure than exposing it directly.

## Required Environment Variables

### `API_URL` (Server-Side Only)
- **What it is:** Your observa-api backend URL
- **Where to get it:** After deploying observa-api to Vercel, use that URL
- **Example:** `https://observa-api.vercel.app`
- **Important:** This is **NOT** exposed to the browser (no `NEXT_PUBLIC_` prefix)
- **Why:** Keeps your API endpoint private and secure

## Optional Environment Variables

### `NEXT_PUBLIC_SENTRY_DSN`
- **What it is:** Sentry DSN for client-side error tracking
- **Where to get it:** Sentry.io → Create Next.js project → Copy DSN
- **Note:** Safe to expose (Sentry DSNs are designed to be public)

### `SENTRY_DSN`
- **What it is:** Sentry DSN for server-side error tracking
- **Where to get it:** Same as above (can use same DSN)

### `SENTRY_ORG`
- **What it is:** Your Sentry organization slug
- **Where to get it:** Sentry dashboard URL: `sentry.io/organizations/YOUR-ORG-SLUG/`

### `SENTRY_PROJECT`
- **What it is:** Your Sentry project name
- **Where to get it:** Sentry dashboard URL: `sentry.io/.../projects/YOUR-PROJECT-NAME/`

## Setting Up in Vercel

1. Go to Vercel Dashboard → Your `observa-app` project
2. Settings → Environment Variables
3. Add `API_URL`:
   - **Name:** `API_URL`
   - **Value:** `https://observa-api.vercel.app` (or your actual API URL)
   - **Environments:** Select all (Production, Preview, Development)
4. Add optional Sentry variables if using error monitoring
5. Redeploy after adding variables

## How It Works

### Before (Less Secure):
```
Browser → Direct API Call → observa-api.vercel.app
         (API URL visible in browser)
```

### After (More Secure):
```
Browser → Next.js API Route (/api/auth/login) → observa-api.vercel.app
         (API URL hidden, only visible server-side)
```

## Benefits

✅ **API URL is hidden** from browser inspection  
✅ **Server-side rate limiting** and validation  
✅ **Additional security layer**  
✅ **Better error handling**  
✅ **Request/response sanitization** possible

## Local Development

Create a `.env.local` file:

```env
API_URL=http://localhost:3000
```

The Next.js API routes will automatically use this for local development.

