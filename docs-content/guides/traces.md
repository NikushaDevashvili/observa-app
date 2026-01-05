# Traces Guide

Complete guide to understanding and using traces in Observa.

## What are Traces?

Traces represent a single execution of your AI application, including:
- User queries
- LLM calls
- Tool calls
- Retrievals
- Errors
- Final outputs

## Viewing Traces

### List View

1. Navigate to "Traces" in the dashboard
2. See all traces with:
   - Timestamp
   - User query
   - Model used
   - Latency
   - Cost
   - Issue indicators

### Detail View

Click on a trace to see:
- **Summary**: High-level information (query, response, model, tokens, cost)
- **Spans**: Hierarchical view of all operations
- **Signals**: Detected issues and anomalies
- **Timeline**: Chronological view of events

## Trace Structure

### Summary

Contains:
- `trace_id`: Unique identifier
- `query`: User's question/input
- `response`: Final output
- `model`: LLM model used
- `tokens_total`: Total tokens consumed
- `latency_ms`: Total latency
- `cost`: Estimated cost
- `status`: Success or error

### Spans

Spans represent individual operations:
- **Root Span**: The trace itself
- **LLM Call Spans**: Each LLM API call
- **Tool Call Spans**: Each tool/function call
- **Retrieval Spans**: Each RAG retrieval
- **Error Spans**: Errors that occurred
- **Feedback Spans**: User feedback (likes, dislikes, ratings, corrections)

### Hierarchy

Spans form a tree:
```
Trace (root)
  ├── Retrieval
  ├── LLM Call
  │   ├── Tool Call
  │   └── Tool Call
  ├── Output
  └── Feedback (linked to LLM Call)
```

**Feedback Spans**: User feedback can be linked to specific operations (like LLM calls) to provide context about which part of the trace the user is providing feedback on. Feedback spans are visually distinct with color-coded badges:
- 👍 **Like**: Green badge
- 👎 **Dislike**: Red badge
- ⭐ **Rating**: Yellow badge (shows rating value)
- ✏️ **Correction**: Blue badge

## Filtering Traces

### By Project

Select a project to see only traces from that project.

### By Time Range

- Last 24 hours
- Last 7 days
- Last 30 days
- Custom range

### By Issue Type

Filter to see only traces with:
- Errors
- High latency
- Cost spikes
- Tool failures
- User feedback (likes, dislikes, ratings)

## Understanding Trace Data

### Latency

- **Total Latency**: End-to-end time
- **LLM Latency**: Time for LLM response
- **Tool Latency**: Time for tool execution
- **Retrieval Latency**: Time for RAG retrieval

### Cost

- **Total Cost**: Sum of all LLM call costs
- **Cost per Model**: Breakdown by model
- **Cost per Route**: Breakdown by API route

### Tokens

- **Total Tokens**: Sum of all tokens
- **Input Tokens**: Prompt tokens
- **Output Tokens**: Completion tokens
- **Tokens per Model**: Breakdown by model

## Signals and Issues

Traces may have signals indicating:
- **Errors**: Tool failures, timeouts
- **High Latency**: Slow operations
- **Cost Spikes**: Unusually expensive calls
- **Token Spikes**: Very large token usage
- **Quality Issues**: Detected quality problems

## User Feedback

Traces can include user feedback to help identify system issues and improve AI responses:

### Feedback Types

- **Like** 👍: User liked the response (green badge)
- **Dislike** 👎: User disliked the response (red badge)
- **Rating** ⭐: 1-5 star rating (yellow badge)
- **Correction** ✏️: User provided correction/feedback (blue badge)

### Viewing Feedback

1. Navigate to a trace detail view
2. Look for feedback spans in the trace tree
3. Feedback spans show:
   - Feedback type with color-coded badge
   - User comment (if provided)
   - Rating value (for rating type)
   - Outcome classification (success/failure/partial)
   - Link to the specific operation being rated

### Feedback Analytics

View feedback metrics on the dashboard:
- Total feedback count
- Like/dislike ratio
- Average rating
- Feedback rate (percentage of traces with feedback)
- Breakdown by type and outcome

Feedback data helps AI developers:
- Identify problematic responses
- Track user satisfaction
- Improve system quality
- Monitor feedback trends over time

## Related Documentation

- [Dashboard Guide](./dashboard.md)
- [Sessions Guide](./sessions.md)
- [Issues Guide](./issues.md)
- [API Endpoints](../api/endpoints.md)

---

**Need help?** Check the [Troubleshooting Guide](../troubleshooting/common-issues.md).

