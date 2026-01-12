# Quick Start Guide

Get up and running with Observa in 5 minutes.

## Step 1: Sign Up

### Option A: Via Dashboard

1. Go to [Observa Dashboard](https://observa-app.vercel.app)
2. Click "Sign Up"
3. Enter your email and company name
4. Complete signup

### Option B: Via API

```bash
curl -X POST https://observa-api.vercel.app/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your@email.com",
    "password": "your-secure-password",
    "companyName": "Your Company",
    "plan": "free"
  }'
```

Save the `apiKey` from the response.

## Step 2: Install SDK

```bash
npm install observa-sdk
```

## Step 3: Initialize SDK

```typescript
import { init } from "observa-sdk";

const observa = init({
  apiKey: process.env.OBSERVA_API_KEY!,
});
```

## Step 4: Send Your First Trace

### Option A: Auto-Capture (Recommended - Easiest)

```typescript
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Wrap with Observa - automatic tracking!
const wrappedOpenAI = observa.observeOpenAI(openai, {
  name: "my-first-app",
  userId: "user-123",
});

// Use wrapped client - automatically tracked!
const response = await wrappedOpenAI.chat.completions.create({
  model: "gpt-3.5-turbo",
  messages: [{ role: "user", content: "Hello!" }],
});

console.log(response.choices[0].message.content);
```

### Option B: Manual Tracking

```typescript
// Start trace
const traceId = observa.startTrace({
  userId: "user-123",
  name: "My First Trace",
});

// Track LLM call
observa.trackLLMCall({
  model: "gpt-4",
  input: "Hello!",
  output: "Hi there!",
  inputTokens: 10,
  outputTokens: 20,
  totalTokens: 30,
  latencyMs: 1200,
  providerName: "openai",
  operationName: "chat",
});

// End trace (sends events)
await observa.endTrace();
```

## Step 5: View in Dashboard

1. Go to [Observa Dashboard](https://observa-app.vercel.app)
2. Navigate to "Traces"
3. See your trace appear within seconds

## Next Steps

- [Full Onboarding Guide](./onboarding.md)
- [SDK Installation](./../sdk/installation.md)
- [Dashboard Guide](./../guides/dashboard.md)

---

**That's it!** You're now tracking your AI applications with Observa.
