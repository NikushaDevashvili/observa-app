"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

export default function ConversationsPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false,
  });
  const [filter, setFilter] = useState<"all" | "issues">("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConversations();
  }, [filter, pagination.offset]);

  const fetchConversations = async () => {
    try {
      setError(null);
      const token = localStorage.getItem("sessionToken");
      if (!token) {
        router.push("/auth/login");
        return;
      }

      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
      });

      if (filter === "issues") {
        params.append("hasIssues", "true");
      }

      const response = await fetch(`/api/conversations?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("[Conversations Page] Response data:", {
          success: data.success,
          conversationsCount: data.conversations?.length || 0,
          pagination: data.pagination,
          fullData: data
        });
        
        if (data.success && data.conversations) {
          setConversations(data.conversations);
          setPagination((prev) => ({
            ...prev,
            total: data.pagination?.total || 0,
            hasMore: data.pagination?.hasMore || false,
          }));
        } else if (data.success && Array.isArray(data.conversations) && data.conversations.length === 0) {
          // Empty list is valid - no conversations yet
          setConversations([]);
          setPagination((prev) => ({
            ...prev,
            total: data.pagination?.total || 0,
            hasMore: false,
          }));
        } else {
          console.error("[Conversations Page] Invalid response format:", data);
          setError(data.error || "Invalid response format from server");
        }
      } else {
        const errorData = await response.json().catch(() => ({ 
          error: `HTTP ${response.status} Error`,
          details: "Could not parse error response"
        }));
        const errorMessage = errorData.error || `Failed to load conversations (${response.status})`;
        const errorDetails = errorData.details ? ` - ${errorData.details}` : "";
        setError(`${errorMessage}${errorDetails}`);
        console.error("Conversations fetch error:", errorData);
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
      setError(error instanceof Error ? error.message : "Failed to load conversations");
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
        <div>Loading conversations...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: "2rem",
          backgroundColor: "#fff",
          borderRadius: "0.5rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ color: "#ef4444", marginBottom: "1rem" }}>Error</h2>
        <p style={{ color: "#6b7280", marginBottom: "1rem" }}>{error}</p>
        <button
          onClick={() => {
            setError(null);
            fetchConversations();
          }}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: "0.375rem",
            cursor: "pointer",
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          marginBottom: "2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "#111827" }}>
          Conversations
        </h1>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            onClick={() => {
              setFilter("all");
              setPagination((prev) => ({ ...prev, offset: 0 }));
            }}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: filter === "all" ? "#2563eb" : "#e5e7eb",
              color: filter === "all" ? "#fff" : "#111827",
              border: "none",
              borderRadius: "0.375rem",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            All
          </button>
          <button
            onClick={() => {
              setFilter("issues");
              setPagination((prev) => ({ ...prev, offset: 0 }));
            }}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: filter === "issues" ? "#2563eb" : "#e5e7eb",
              color: filter === "issues" ? "#fff" : "#111827",
              border: "none",
              borderRadius: "0.375rem",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            With Issues
          </button>
        </div>
      </div>

      {conversations.length === 0 && !loading ? (
        <div
          style={{
            backgroundColor: "#fff",
            padding: "3rem",
            borderRadius: "0.5rem",
            textAlign: "center",
            color: "#6b7280",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <p style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>No conversations found</p>
          <p style={{ fontSize: "0.875rem", color: "#9ca3af" }}>
            Start a conversation in your application to see it here.
          </p>
        </div>
      ) : conversations.length > 0 ? (
        <>
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "0.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                  <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.875rem", fontWeight: 600, color: "#6b7280" }}>
                    Conversation ID
                  </th>
                  <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.875rem", fontWeight: 600, color: "#6b7280" }}>
                    User
                  </th>
                  <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.875rem", fontWeight: 600, color: "#6b7280" }}>
                    Messages
                  </th>
                  <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.875rem", fontWeight: 600, color: "#6b7280" }}>
                    Tokens
                  </th>
                  <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.875rem", fontWeight: 600, color: "#6b7280" }}>
                    Cost
                  </th>
                  <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.875rem", fontWeight: 600, color: "#6b7280" }}>
                    Last Message
                  </th>
                  <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.875rem", fontWeight: 600, color: "#6b7280" }}>
                    Status
                  </th>
                  <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.875rem", fontWeight: 600, color: "#6b7280" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {conversations.map((conv) => (
                  <tr
                    key={conv.id}
                    style={{ borderBottom: "1px solid #e5e7eb" }}
                  >
                    <td style={{ padding: "1rem", fontSize: "0.875rem", color: "#111827" }}>
                      <code style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                        {conv.conversation_id.substring(0, 20)}...
                      </code>
                    </td>
                    <td style={{ padding: "1rem", fontSize: "0.875rem", color: "#111827" }}>
                      {conv.user_id || "N/A"}
                    </td>
                    <td style={{ padding: "1rem", fontSize: "0.875rem", color: "#111827" }}>
                      {conv.message_count}
                    </td>
                    <td style={{ padding: "1rem", fontSize: "0.875rem", color: "#111827" }}>
                      {Number(conv.total_tokens || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: "1rem", fontSize: "0.875rem", color: "#111827" }}>
                      ${Number(conv.total_cost || 0).toFixed(4)}
                    </td>
                    <td style={{ padding: "1rem", fontSize: "0.875rem", color: "#6b7280" }}>
                      {new Date(conv.last_message_at).toLocaleString()}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      {conv.has_issues ? (
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.25rem 0.5rem",
                            backgroundColor: "#fee2e2",
                            color: "#991b1b",
                            borderRadius: "0.25rem",
                            fontSize: "0.75rem",
                            fontWeight: 500,
                          }}
                        >
                          Issues
                        </span>
                      ) : (
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.25rem 0.5rem",
                            backgroundColor: "#d1fae5",
                            color: "#065f46",
                            borderRadius: "0.25rem",
                            fontSize: "0.75rem",
                            fontWeight: 500,
                          }}
                        >
                          OK
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <Link
                        href={`/dashboard/conversations/${conv.conversation_id}`}
                        style={{
                          color: "#2563eb",
                          textDecoration: "none",
                          fontSize: "0.875rem",
                          fontWeight: 500,
                        }}
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.total > 0 && (
            <div
              style={{
                marginTop: "2rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>
                Showing {pagination.offset + 1} to{" "}
                {Math.min(pagination.offset + pagination.limit, pagination.total)} of{" "}
                {pagination.total} conversations
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={() => {
                    setPagination((prev) => ({
                      ...prev,
                      offset: Math.max(0, prev.offset - prev.limit),
                    }));
                  }}
                  disabled={pagination.offset === 0}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: pagination.offset === 0 ? "#e5e7eb" : "#2563eb",
                    color: pagination.offset === 0 ? "#9ca3af" : "#fff",
                    border: "none",
                    borderRadius: "0.375rem",
                    cursor: pagination.offset === 0 ? "not-allowed" : "pointer",
                    fontSize: "0.875rem",
                  }}
                >
                  Previous
                </button>
                <button
                  onClick={() => {
                    setPagination((prev) => ({
                      ...prev,
                      offset: prev.offset + prev.limit,
                    }));
                  }}
                  disabled={!pagination.hasMore}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: !pagination.hasMore ? "#e5e7eb" : "#2563eb",
                    color: !pagination.hasMore ? "#9ca3af" : "#fff",
                    border: "none",
                    borderRadius: "0.375rem",
                    cursor: !pagination.hasMore ? "not-allowed" : "pointer",
                    fontSize: "0.875rem",
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

