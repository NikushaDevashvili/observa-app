# SDK Testing Guide

Complete guide to testing the Observa SDK with auto-capture instrumentation.

## Prerequisites

1. **Backend API Running**: The Observa API must be running locally or accessible
2. **Frontend App Running** (optional): For viewing traces in the dashboard
3. **OpenAI API Key**: For testing OpenAI integration
4. **Node.js**: Version 18+ recommended

## Quick Test (5 Minutes)

### Step 1: Start Backend API

```bash
cd observa-api
npm install
npm run dev
# Server runs on http://localhost:3000
```

### Step 2: Get Your API Key

#### Option A: Via Signup (Recommended)

1. Go to `http://localhost:3001/signup` (or use the production signup URL)
2. Enter your email and company name
3. Copy the API key displayed after signup

#### Option B: Via API

```bash
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test-password",
    "companyName": "Test Company",
    "plan": "free"
  }'
```

Save the `apiKey` from the response.

### Step 3: Create Test Script

Create a file `test-sdk.js`:

```javascript
import { init } from "observa-sdk";
import OpenAI from "openai";
import * as dotenv from "dotenv";

dotenv.config();

// Initialize Observa
const observa = init({
  apiKey: process.env.OBSERVA_API_KEY,
  apiUrl: process.env.OBSERVA_API_URL || "http://localhost:3000",
  mode: "development", // Shows pretty logs in console
});

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testBasic() {
  console.log("Testing basic OpenAI integration...");

  // Wrap OpenAI client with Observa
  const wrappedOpenAI = observa.observeOpenAI(openai, {
    name: "test-app",
    userId: "test-user-123",
    tags: ["testing", "sdk"],
  });

  // Make a simple API call
  const response = await wrappedOpenAI.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: "Say hello in 5 words" }],
    max_tokens: 50,
  });

  console.log("Response:", response.choices[0].message.content);
  console.log("\n✅ Basic test completed! Check your dashboard for the trace.");
}

async function testStreaming() {
  console.log("\nTesting streaming integration...");

  const wrappedOpenAI = observa.observeOpenAI(openai, {
    name: "test-app-streaming",
    userId: "test-user-123",
  });

  const stream = await wrappedOpenAI.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: "Count from 1 to 5" }],
    stream: true,
  });

  console.log("Streaming response:");
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      process.stdout.write(content);
    }
  }
  console.log("\n\n✅ Streaming test completed!");
}

async function testWithRedaction() {
  console.log("\nTesting with PII redaction...");

  const wrappedOpenAI = observa.observeOpenAI(openai, {
    name: "test-app-redaction",
    userId: "test-user-123",
    redact: (data) => {
      // Example: Redact messages before sending to Observa
      if (data?.messages) {
        return {
          ...data,
          messages: data.messages.map((msg) => ({
            ...msg,
            content: "[REDACTED]",
          })),
        };
      }
      return data;
    },
  });

  const response = await wrappedOpenAI.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "user", content: "My SSN is 123-45-6789. Remember this." },
    ],
  });

  console.log("Response received (messages redacted in Observa)");
  console.log("\n✅ Redaction test completed!");
}

async function testAnthropic() {
  console.log("\nTesting Anthropic integration...");

  // Only test if Anthropic SDK is installed
  try {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const wrappedAnthropic = observa.observeAnthropic(anthropic, {
      name: "test-app-anthropic",
      userId: "test-user-123",
    });

    const response = await wrappedAnthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 100,
      messages: [{ role: "user", content: "Say hello" }],
    });

    console.log("Response:", response.content[0].text);
    console.log("\n✅ Anthropic test completed!");
  } catch (error) {
    console.log("⚠️  Anthropic SDK not installed, skipping test");
    console.log("   Install with: npm install @anthropic-ai/sdk");
  }
}

async function runAllTests() {
  try {
    await testBasic();
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2s between tests

    await testStreaming();
    await new Promise((resolve) => setTimeout(resolve, 2000));

    await testWithRedaction();
    await new Promise((resolve) => setTimeout(resolve, 2000));

    await testAnthropic();

    console.log("\n🎉 All tests completed!");
    console.log("\nNext steps:");
    console.log("1. Open http://localhost:3001/dashboard/traces");
    console.log("2. Look for traces with name 'test-app*'");
    console.log("3. Click on a trace to see full details");
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

runAllTests();
```

### Step 4: Set Environment Variables

Create a `.env` file:

```env
# Observa API Key (from signup)
OBSERVA_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Observa API URL (use localhost for local testing)
OBSERVA_API_URL=http://localhost:3000

# OpenAI API Key (for testing OpenAI integration)
OPENAI_API_KEY=sk-...

# Anthropic API Key (optional, for testing Anthropic integration)
ANTHROPIC_API_KEY=sk-ant-...
```

### Step 5: Install Dependencies

```bash
npm install observa-sdk openai dotenv
# Optional: npm install @anthropic-ai/sdk
```

### Step 6: Run Tests

```bash
node test-sdk.js
```

You should see:
- Console logs showing test progress
- Beautiful formatted trace logs (in development mode)
- API responses from OpenAI

### Step 7: Verify in Dashboard

1. Start the frontend app (if not running):
   ```bash
   cd observa-app
   npm install
   npm run dev
   # App runs on http://localhost:3001
   ```

2. Open http://localhost:3001/dashboard/traces

3. Look for traces with names:
   - `test-app` (basic test)
   - `test-app-streaming` (streaming test)
   - `test-app-redaction` (redaction test)
   - `test-app-anthropic` (Anthropic test)

4. Click on a trace to see:
   - Full request/response data
   - Token usage
   - Latency metrics
   - Time-to-first-token (for streaming)

## Detailed Testing Scenarios

### Test 1: Auto-Capture with OpenAI (Recommended)

This is the easiest way to test - automatic tracing with zero code changes:

```typescript
import { init } from "observa-sdk";
import OpenAI from "openai";

const observa = init({
  apiKey: process.env.OBSERVA_API_KEY!,
  apiUrl: "http://localhost:3000",
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Wrap once - all calls automatically tracked!
const wrappedOpenAI = observa.observeOpenAI(openai, {
  name: "my-app",
  userId: "user-123",
});

// Use normally - automatically tracked!
const response = await wrappedOpenAI.chat.completions.create({
  model: "gpt-4",
  messages: [{ role: "user", content: "Hello!" }],
});
```

**What to verify:**
- Trace appears in dashboard within seconds
- Request/response data is captured
- Token usage is tracked
- Latency is measured

### Test 2: Streaming Support

Test that streaming responses work correctly and preserve TTFT (Time-To-First-Token):

```typescript
const wrappedOpenAI = observa.observeOpenAI(openai);

const stream = await wrappedOpenAI.chat.completions.create({
  model: "gpt-4",
  messages: [{ role: "user", content: "Count to 10" }],
  stream: true,
});

let firstTokenTime: number | null = null;
for await (const chunk of stream) {
  if (firstTokenTime === null) {
    firstTokenTime = Date.now();
    console.log("First token received!");
  }
  process.stdout.write(chunk.choices[0]?.delta?.content || "");
}
```

**What to verify:**
- Stream works normally (no blocking)
- First token arrives quickly (TTFT preserved)
- Full response is tracked after stream completes
- Token count is accurate

### Test 3: PII Redaction

Test that sensitive data can be redacted before sending to Observa:

```typescript
const wrappedOpenAI = observa.observeOpenAI(openai, {
  redact: (data) => {
    // Redact sensitive information
    if (data?.messages) {
      return {
        ...data,
        messages: data.messages.map((msg) => ({
          ...msg,
          content: "[REDACTED]",
        })),
      };
    }
    return data;
  },
});

await wrappedOpenAI.chat.completions.create({
  model: "gpt-4",
  messages: [{ role: "user", content: "My password is secret123" }],
});
```

**What to verify:**
- Trace appears in dashboard
- Request messages show `[REDACTED]` instead of actual content
- Response is still captured (not redacted in this example)

### Test 4: Anthropic Integration

Test Anthropic SDK auto-capture:

```typescript
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const wrappedAnthropic = observa.observeAnthropic(anthropic, {
  name: "my-app",
  userId: "user-123",
});

const response = await wrappedAnthropic.messages.create({
  model: "claude-3-haiku-20240307",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Hello!" }],
});
```

**What to verify:**
- Trace appears in dashboard
- Provider is correctly identified as "anthropic"
- Token usage is tracked
- Response data is captured

### Test 5: Manual Tracking (Advanced)

For providers without auto-capture wrappers, use manual tracking:

```typescript
// For Gemini, LangChain, or other providers
const startTime = Date.now();
const response = await geminiModel.generateContent("Hello!");

observa.trackLLMCall({
  model: "gemini-pro",
  input: "Hello!",
  output: response.text,
  inputTokens: response.usage?.promptTokenCount,
  outputTokens: response.usage?.candidatesTokenCount,
  latencyMs: Date.now() - startTime,
  providerName: "google", // Auto-inferred from model name
  operationName: "generate_content",
});
```

**What to verify:**
- Trace appears in dashboard
- Provider is correctly identified
- All metrics are captured

## Troubleshooting

### "Failed to load OpenAI wrapper"

**Cause**: The instrumentation module couldn't be loaded.

**Solution**: 
- Make sure you're using Node.js (not browser)
- Check that `observa-sdk` is installed: `npm list observa-sdk`
- Rebuild SDK: `cd observa-sdk && npm run build`

### "Invalid API Key"

**Cause**: API key is missing or incorrect.

**Solution**:
- Check `.env` file has `OBSERVA_API_KEY` set
- Verify API key format (should be a JWT)
- Make sure you copied the full API key from signup

### "Events Not Appearing in Dashboard"

**Cause**: Events not being sent or backend not running.

**Solution**:
- Check backend is running: `curl http://localhost:3000/health`
- Check network requests in browser DevTools
- Look for console errors
- Verify API URL is correct: `http://localhost:3000` for local testing

### "Streaming Not Working"

**Cause**: Stream is being consumed before user can read it.

**Solution**:
- Make sure you're using the wrapped client
- Check that streaming mode is enabled: `stream: true`
- Verify you're iterating over the stream correctly

## Next Steps

- [SDK Installation Guide](./installation.md) - Setup instructions
- [SDK Examples](./examples.md) - More code examples
- [Events Reference](./events-reference.md) - Event format documentation
- [Dashboard Guide](../guides/dashboard.md) - How to use the dashboard

## Related Documentation

- [Quick Start Guide](../getting-started/quick-start.md)
- [API Documentation](../api/endpoints.md)
- [Troubleshooting Guide](../troubleshooting/common-issues.md)
