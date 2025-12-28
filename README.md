# Observa App

Customer-facing web application for Observa - signup, dashboard, and management interface.

## Features

- **Self-Service Signup**: Quick customer onboarding with automatic token provisioning
- **API Key Display**: Prominently displayed API key with copy-to-clipboard
- **Quick Start Guide**: SDK installation and usage instructions

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Configure your `.env` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
# Or your production API URL:
# NEXT_PUBLIC_API_URL=https://api.observa.ai
```

4. Run development server:
```bash
npm run dev
```

5. Open [http://localhost:3001](http://localhost:3001) in your browser

## Architecture

This is part of a multi-repo architecture:

- **`observa-sdk`**: npm package for customer SDK
- **`observa-api`**: Backend API service
- **`observa-app`** (this repo): Customer-facing web app

## Development

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Tech Stack

- **Next.js 14+** (App Router)
- **TypeScript**
- **React 18**

# observa-app
