# SDK Implementation Examples

Complete working examples for integrating Observa SDK into your application.

## Basic Example

```typescript
import { init } from "observa-sdk";

const observa = init({
  apiKey: process.env.OBSERVA_API_KEY!,
});

// Start trace
const traceId = observa.startTrace({
  userId: "user-123",
  conversationId: "conv-456",
  name: "Customer Support",
});

try {
  // Track LLM call
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: "Hello!" }],
  });

  observa.trackLLMCall({
    model: "gpt-4",
    input: "Hello!",
    output: response.choices[0].message.content || "",
    tokensPrompt: response.usage.prompt_tokens,
    tokensCompletion: response.usage.completion_tokens,
    tokensTotal: response.usage.total_tokens,
    latencyMs: 1200,
  });

  await observa.endTrace();
} catch (error) {
  observa.trackError({
    errorType: "llm_error",
    errorMessage: error instanceof Error ? error.message : "Unknown error",
  });
  await observa.endTrace();
}
```

## OpenAI Integration

```typescript
import OpenAI from "openai";
import { init } from "observa-sdk";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const observa = init({ apiKey: process.env.OBSERVA_API_KEY! });

async function chatWithObserva(userMessage: string, userId: string) {
  const traceId = observa.startTrace({
    userId,
    name: "Chat Completion",
  });

  try {
    const startTime = Date.now();
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: userMessage }],
    });

    const latency = Date.now() - startTime;

    observa.trackLLMCall({
      model: response.model,
      input: userMessage,
      output: response.choices[0].message.content || "",
      tokensPrompt: response.usage.prompt_tokens,
      tokensCompletion: response.usage.completion_tokens,
      tokensTotal: response.usage.total_tokens,
      latencyMs: latency,
    });

    await observa.endTrace();
    return response.choices[0].message.content;
  } catch (error) {
    observa.trackError({
      errorType: "openai_error",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    await observa.endTrace();
    throw error;
  }
}
```

## RAG with Full Tracking (Embeddings, Vector DB, Retrieval, LLM)

```typescript
async function ragWithObserva(query: string, userId: string) {
  const traceId = observa.startTrace({ userId, name: "RAG Query" });

  try {
    // 1. Track embedding generation
    const embeddingStart = Date.now();
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: query,
    });
    const embedding = embeddingResponse.data[0].embedding;
    
    observa.trackEmbedding({
      model: "text-embedding-ada-002",
      dimensionCount: 1536,
      inputTokens: 10,
      outputTokens: 1536,
      latencyMs: Date.now() - embeddingStart,
      cost: 0.0001,
      inputText: query,
    });

    // 2. Track vector database search
    const vectorDbStart = Date.now();
    const vectorResults = await vectorDB.query(embedding, { k: 3 });
    
    observa.trackVectorDbOperation({
      operationType: "vector_search",
      indexName: "documents",
      vectorDimensions: 1536,
      vectorMetric: "cosine",
      resultsCount: vectorResults.length,
      scores: vectorResults.map((r) => r.score),
      latencyMs: Date.now() - vectorDbStart,
      cost: 0.0005,
      providerName: "pinecone",
    });

    // 3. Track retrieval with context
    const retrievalStart = Date.now();
    const context = vectorResults.map((r) => r.text);
    
    observa.trackRetrieval({
      contextIds: vectorResults.map((r) => r.id),
      k: 3,
      similarityScores: vectorResults.map((r) => r.score),
      latencyMs: Date.now() - retrievalStart,
      embeddingModel: "text-embedding-ada-002",
      embeddingDimensions: 1536,
      vectorMetric: "cosine",
      retrievalContext: context.join("\n\n"),
    });

    // 4. Track LLM call with context
    const llmStart = Date.now();
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "Answer using the provided context." },
        { role: "user", content: query },
      ],
    });

    observa.trackLLMCall({
      model: "gpt-4",
      input: query,
      output: response.choices[0].message.content || "",
      inputTokens: response.usage.prompt_tokens,
      outputTokens: response.usage.completion_tokens,
      totalTokens: response.usage.total_tokens,
      latencyMs: Date.now() - llmStart,
      operationName: "chat",
      providerName: "openai",
      inputCost: 0.00245,
      outputCost: 0.01024,
    });

    await observa.endTrace();
    return response.choices[0].message.content;
  } catch (error) {
    observa.trackError({
      errorType: "rag_error",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      errorCategory: "application_error",
    });
    await observa.endTrace();
    throw error;
  }
}
```

## Tool Calls Tracking

```typescript
async function agentWithTools(userQuery: string) {
  const traceId = observa.startTrace({ userId: "user-123" });

  try {
    // Track tool call
    const toolStart = Date.now();
    const weatherData = await getWeather(userQuery);
    observa.trackToolCall({
      toolName: "get_weather",
      args: { query: userQuery },
      result: weatherData,
      resultStatus: "success",
      latencyMs: Date.now() - toolStart,
    });

    // Track LLM call with tool result
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "user", content: userQuery },
        { role: "assistant", content: `Weather: ${JSON.stringify(weatherData)}` },
      ],
    });

    observa.trackLLMCall({
      model: "gpt-4",
      input: userQuery,
      output: response.choices[0].message.content || "",
      tokensTotal: response.usage.total_tokens,
      latencyMs: 1500,
    });

    await observa.endTrace();
  } catch (error) {
    observa.trackError({
      errorType: "tool_error",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    await observa.endTrace();
  }
}
```

## Express Middleware

```typescript
import express from "express";
import { init } from "observa-sdk";

const observa = init({
  apiKey: process.env.OBSERVA_API_KEY!,
});

function observaMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const traceId = observa.startTrace({
    userId: req.user?.id,
    sessionId: req.session?.id,
    name: `${req.method} ${req.path}`,
  });

  res.on("finish", async () => {
    if (res.statusCode >= 400) {
      observa.trackError({
        errorType: "http_error",
        errorMessage: `HTTP ${res.statusCode}`,
      });
    }
    await observa.endTrace();
  });

  next();
}

app.use(observaMiddleware);
```

## User Feedback Tracking

### Basic Like/Dislike Feedback

```typescript
// User clicks "like" button after receiving AI response
observa.trackFeedback({
  type: "like",
  outcome: "success",
  conversationId: "conv-123",
  userId: "user-456",
});

// User clicks "dislike" button
observa.trackFeedback({
  type: "dislike",
  outcome: "failure",
  comment: "The answer was incorrect",
  conversationId: "conv-123",
  userId: "user-456",
});
```

### Rating Feedback (1-5 Scale)

```typescript
// User provides a 5-star rating
observa.trackFeedback({
  type: "rating",
  rating: 5, // Automatically clamped to 1-5 range
  comment: "Excellent response!",
  outcome: "success",
  conversationId: "conv-123",
  userId: "user-456",
});
```

### Feedback Linked to Specific LLM Call

```typescript
async function chatWithFeedback(userMessage: string, userId: string) {
  const traceId = observa.startTrace({
    userId,
    conversationId: `conv-${userId}-${Date.now()}`,
    name: "Chat with Feedback",
  });

  try {
    // Track LLM call
    const llmSpanId = observa.trackLLMCall({
      model: "gpt-4",
      input: userMessage,
      output: aiResponse,
      tokensTotal: usage.total_tokens,
      latencyMs: 1200,
    });

    // User provides feedback - link it to the LLM call
    observa.trackFeedback({
      type: "like",
      parentSpanId: llmSpanId, // Attach feedback to specific LLM call
      conversationId: `conv-${userId}-${Date.now()}`,
      userId,
      outcome: "success",
    });

    await observa.endTrace();
  } catch (error) {
    observa.trackError({
      errorType: "chat_error",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    await observa.endTrace();
  }
}
```

### Express Route with Feedback Endpoint

```typescript
import express from "express";
import { init } from "observa-sdk";

const observa = init({ apiKey: process.env.OBSERVA_API_KEY! });

// Endpoint to receive user feedback
app.post("/api/feedback", async (req, res) => {
  const { type, rating, comment, conversationId, traceId } = req.body;
  const userId = req.user?.id;

  try {
    // Track feedback
    observa.trackFeedback({
      type: type, // "like" | "dislike" | "rating" | "correction"
      rating: rating ? Number(rating) : undefined,
      comment: comment || undefined,
      outcome: type === "like" || (type === "rating" && rating >= 4) 
        ? "success" 
        : type === "dislike" || (type === "rating" && rating <= 2)
        ? "failure"
        : "partial",
      conversationId: conversationId || undefined,
      userId: userId || undefined,
      agentName: "api-server",
      version: process.env.APP_VERSION,
      route: "/api/feedback",
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to track feedback:", error);
    res.status(500).json({ error: "Failed to track feedback" });
  }
});
```

## Related Documentation

- [SDK Installation](./installation.md)
- [SDK Migration Guide](./migration.md)
- [Event Reference](./events-reference.md)
- [API Documentation](../api/endpoints.md)

---

**More examples?** Check the [SDK Implementation Example](../../SDK_IMPLEMENTATION_EXAMPLE.md) for advanced patterns.

