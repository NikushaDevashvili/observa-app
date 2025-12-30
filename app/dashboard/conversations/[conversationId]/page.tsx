"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Message {
  trace_id: string;
  message_index: number | null;
  query: string | null;
  response: string | null;
  model: string | null;
  timestamp: string | null;
  is_hallucination: boolean | null;
  has_context_drop: boolean;
  has_faithfulness_issue: boolean;
  hallucination_confidence: number | null;
  context_relevance_score: string | null;
  answer_faithfulness_score: number | null;
}

interface Conversation {
  id: string;
  conversation_id: string;
  user_id: string | null;
  started_at: string;
  last_message_at: string;
  message_count: number;
  total_tokens: number;
  total_cost: number;
  has_issues: boolean;
}

interface Analytics {
  totalMessages: number;
  totalTokens: number;
  totalCost: number;
  averageLatency: number;
  issueCount: number;
  hallucinationRate: number;
  contextDropRate: number;
  faithfulnessIssueRate: number;
}

export default function ConversationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as string;
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (conversationId) {
      fetchConversation();
      fetchMessages();
      fetchAnalytics();
    }
  }, [conversationId]);

  const fetchConversation = async () => {
    try {
      const token = localStorage.getItem("sessionToken");
      if (!token) {
        router.push("/auth/login");
        return;
      }

      const response = await fetch(`/api/conversations/${conversationId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.conversation) {
          setConversation(data.conversation);
        } else {
          setError(data.error || "Failed to load conversation");
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        setError(errorData.error || `Failed to load conversation (${response.status})`);
      }
    } catch (error) {
      console.error("Failed to fetch conversation:", error);
      setError(error instanceof Error ? error.message : "Failed to load conversation");
    }
  };

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("sessionToken");
      if (!token) return;

      const response = await fetch(
        `/api/conversations/${conversationId}/messages?limit=1000`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.messages) {
          setMessages(data.messages);
        }
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem("sessionToken");
      if (!token) return;

      const response = await fetch(
        `/api/conversations/${conversationId}/analytics`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.analytics) {
          setAnalytics(data.analytics);
        }
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "400px",
        }}
      >
        <div>Loading conversation...</div>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div
        style={{
          padding: "2rem",
          backgroundColor: "#fff",
          borderRadius: "0.5rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ color: "#ef4444", marginBottom: "1rem" }}>
          {error ? "Error" : "Conversation not found"}
        </h2>
        <p style={{ color: "#6b7280", marginBottom: "1rem" }}>
          {error || "The conversation you're looking for doesn't exist."}
        </p>
        <Link
          href="/dashboard/conversations"
          style={{
            color: "#2563eb",
            textDecoration: "none",
            fontSize: "0.875rem",
          }}
        >
          ← Back to Conversations
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <Link
          href="/dashboard/conversations"
          style={{
            color: "#2563eb",
            textDecoration: "none",
            fontSize: "0.875rem",
            marginBottom: "1rem",
            display: "inline-block",
          }}
        >
          ← Back to Conversations
        </Link>
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: "bold",
            color: "#111827",
            marginBottom: "0.5rem",
          }}
        >
          Conversation: {conversation.conversation_id.substring(0, 30)}...
        </h1>
        <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>
          User: {conversation.user_id || "N/A"} • Started:{" "}
          {new Date(conversation.started_at).toLocaleString()}
        </div>
      </div>

      {/* Analytics Summary */}
      {analytics && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: "1.5rem",
              borderRadius: "0.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                fontSize: "0.875rem",
                color: "#6b7280",
                marginBottom: "0.5rem",
              }}
            >
              Total Messages
            </div>
            <div
              style={{
                fontSize: "2rem",
                fontWeight: "bold",
                color: "#111827",
              }}
            >
              {analytics.totalMessages}
            </div>
          </div>
          <div
            style={{
              backgroundColor: "#fff",
              padding: "1.5rem",
              borderRadius: "0.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                fontSize: "0.875rem",
                color: "#6b7280",
                marginBottom: "0.5rem",
              }}
            >
              Total Tokens
            </div>
            <div
              style={{
                fontSize: "2rem",
                fontWeight: "bold",
                color: "#111827",
              }}
            >
              {analytics.totalTokens.toLocaleString()}
            </div>
          </div>
          <div
            style={{
              backgroundColor: "#fff",
              padding: "1.5rem",
              borderRadius: "0.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                fontSize: "0.875rem",
                color: "#6b7280",
                marginBottom: "0.5rem",
              }}
            >
              Total Cost
            </div>
            <div
              style={{
                fontSize: "2rem",
                fontWeight: "bold",
                color: "#111827",
              }}
            >
              ${analytics.totalCost.toFixed(4)}
            </div>
          </div>
          <div
            style={{
              backgroundColor: "#fff",
              padding: "1.5rem",
              borderRadius: "0.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                fontSize: "0.875rem",
                color: "#6b7280",
                marginBottom: "0.5rem",
              }}
            >
              Issue Rate
            </div>
            <div
              style={{
                fontSize: "2rem",
                fontWeight: "bold",
                color: analytics.issueCount > 0 ? "#ef4444" : "#10b981",
              }}
            >
              {analytics.issueCount}
            </div>
          </div>
          <div
            style={{
              backgroundColor: "#fff",
              padding: "1.5rem",
              borderRadius: "0.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                fontSize: "0.875rem",
                color: "#6b7280",
                marginBottom: "0.5rem",
              }}
            >
              Hallucination Rate
            </div>
            <div
              style={{
                fontSize: "2rem",
                fontWeight: "bold",
                color: "#111827",
              }}
            >
              {analytics.hallucinationRate.toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div style={{ marginBottom: "2rem" }}>
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: "bold",
            color: "#111827",
            marginBottom: "1rem",
          }}
        >
          Messages ({messages.length})
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {messages.map((message, index) => (
            <div
              key={message.trace_id}
              style={{
                backgroundColor: "#fff",
                padding: "1.5rem",
                borderRadius: "0.5rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                }}
              >
                <div
                  style={{
                    fontSize: "0.875rem",
                    color: "#6b7280",
                    fontWeight: 600,
                  }}
                >
                  Message #{message.message_index || index + 1}
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {message.is_hallucination && (
                    <span
                      style={{
                        padding: "0.25rem 0.5rem",
                        backgroundColor: "#fee2e2",
                        color: "#991b1b",
                        borderRadius: "0.25rem",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                      }}
                    >
                      Hallucination
                    </span>
                  )}
                  {message.has_context_drop && (
                    <span
                      style={{
                        padding: "0.25rem 0.5rem",
                        backgroundColor: "#fef3c7",
                        color: "#92400e",
                        borderRadius: "0.25rem",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                      }}
                    >
                      Context Drop
                    </span>
                  )}
                  {message.has_faithfulness_issue && (
                    <span
                      style={{
                        padding: "0.25rem 0.5rem",
                        backgroundColor: "#fce7f3",
                        color: "#9f1239",
                        borderRadius: "0.25rem",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                      }}
                    >
                      Faithfulness
                    </span>
                  )}
                </div>
              </div>

              {message.query && (
                <div style={{ marginBottom: "1rem" }}>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#6b7280",
                      marginBottom: "0.25rem",
                      fontWeight: 600,
                    }}
                  >
                    QUERY
                  </div>
                  <div
                    style={{
                      padding: "0.75rem",
                      backgroundColor: "#f9fafb",
                      borderRadius: "0.375rem",
                      fontSize: "0.875rem",
                      color: "#111827",
                    }}
                  >
                    {message.query}
                  </div>
                </div>
              )}

              {message.response && (
                <div style={{ marginBottom: "1rem" }}>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#6b7280",
                      marginBottom: "0.25rem",
                      fontWeight: 600,
                    }}
                  >
                    RESPONSE
                  </div>
                  <div
                    style={{
                      padding: "0.75rem",
                      backgroundColor: "#f0f9ff",
                      borderRadius: "0.375rem",
                      fontSize: "0.875rem",
                      color: "#111827",
                    }}
                  >
                    {message.response}
                  </div>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  fontSize: "0.75rem",
                  color: "#6b7280",
                }}
              >
                {message.model && (
                  <span>Model: {message.model}</span>
                )}
                {message.timestamp && (
                  <span>
                    {new Date(message.timestamp).toLocaleString()}
                  </span>
                )}
                <Link
                  href={`/dashboard/traces/${message.trace_id}`}
                  style={{
                    color: "#2563eb",
                    textDecoration: "none",
                  }}
                >
                  View Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

