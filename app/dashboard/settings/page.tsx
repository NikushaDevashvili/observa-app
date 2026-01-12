"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface AccountInfo {
  user: {
    id: string;
    email: string;
    createdAt: string;
    lastLoginAt: string | null;
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    createdAt: string;
  };
  projects: Array<{
    id: string;
    name: string;
    environment: "dev" | "prod";
    createdAt: string;
  }>;
  apiKey: string | null;
  defaultProject: {
    id: string;
    name: string;
    environment: "dev" | "prod";
  } | null;
  observaApiUrl: string;
  hasTinybirdToken: boolean;
}

interface ApiKey {
  id: string;
  tenantId: string;
  projectId: string | null;
  name: string;
  keyPrefix: "sk_" | "pk_";
  scopes: {
    ingest: boolean;
    query?: boolean;
  };
  allowedOrigins: string[];
  revoked: boolean;
  createdAt: string;
  lastUsedAt: string | null;
}

interface NewApiKey {
  apiKey?: string;
  keyRecord?: {
    id: string;
    tenantId: string;
    projectId: string | null;
    name: string;
    keyPrefix: "sk_" | "pk_";
    scopes: {
      ingest: boolean;
      query?: boolean;
    };
    allowedOrigins: string[];
    createdAt: string;
  };
  message?: string;
  important?: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loadingApiKeys, setLoadingApiKeys] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newApiKey, setNewApiKey] = useState<NewApiKey | null>(null);
  const [creating, setCreating] = useState(false);
  const [keyTab, setKeyTab] = useState<"jwt" | "legacy">("jwt");

  useEffect(() => {
    fetchAccountInfo();
  }, []);

  useEffect(() => {
    if (account) {
      fetchApiKeys();
    }
  }, [account]);

  const fetchAccountInfo = async () => {
    try {
      const token = localStorage.getItem("sessionToken");
      if (!token) {
        router.push("/auth/login");
        return;
      }

      const response = await fetch("/api/auth/account", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.account) {
          setAccount(data.account);
        }
      } else if (response.status === 401) {
        localStorage.removeItem("sessionToken");
        router.push("/auth/login");
      }
    } catch (error) {
      console.error("Failed to fetch account info:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApiKeys = async () => {
    if (!account) return;
    setLoadingApiKeys(true);
    try {
      const token = localStorage.getItem("sessionToken");
      if (!token) return;

      const response = await fetch(
        `/api/tenants/${account.tenant.id}/api-keys`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.apiKeys) {
          setApiKeys(data.apiKeys);
        }
      }
    } catch (error) {
      console.error("Failed to fetch API keys:", error);
    } finally {
      setLoadingApiKeys(false);
    }
  };

  const createApiKey = async (formData: {
    name: string;
    keyPrefix: "sk_" | "pk_";
    projectId?: string;
    scopes?: { ingest: boolean; query?: boolean };
  }) => {
    if (!account) return;
    setCreating(true);
    try {
      const token = localStorage.getItem("sessionToken");
      if (!token) return;

      const response = await fetch(
        `/api/tenants/${account.tenant.id}/api-keys`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setNewApiKey(data);
        setShowCreateForm(false);
        fetchApiKeys(); // Refresh list
      } else {
        const error = await response.json();
        alert(`Failed to create API key: ${error.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Failed to create API key:", error);
      alert("Failed to create API key");
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
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
        <div>Loading settings...</div>
      </div>
    );
  }

  if (!account) {
    return (
      <div>
        <p>Failed to load account information</p>
      </div>
    );
  }

  return (
    <div>
      <h1
        style={{
          fontSize: "2rem",
          fontWeight: "bold",
          color: "#111827",
          marginBottom: "2rem",
        }}
      >
        Settings
      </h1>

      {/* API Key Section */}
      <div
        style={{
          backgroundColor: "#fff",
          padding: "1.5rem",
          borderRadius: "0.5rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          marginBottom: "1.5rem",
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
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: "bold",
              color: "#111827",
            }}
          >
            API Keys
          </h2>
          <button
            onClick={() => setShowCreateForm(true)}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: "0.375rem",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            + Create API Key
          </button>
        </div>

        {/* JWT API Key (from signup) */}
        {account.apiKey && (
          <div style={{ marginBottom: "2rem" }}>
            <div
              style={{
                fontSize: "0.875rem",
                color: "#6b7280",
                marginBottom: "0.5rem",
                fontWeight: 600,
              }}
            >
              JWT API Key (Auto-detects tenant/project)
            </div>
            <p
              style={{
                fontSize: "0.875rem",
                color: "#6b7280",
                marginBottom: "1rem",
              }}
            >
              This JWT-formatted key automatically includes tenant and project
              information. Use this for SDK initialization without additional
              configuration.
            </p>
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                alignItems: "center",
              }}
            >
              <code
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  backgroundColor: "#f9fafb",
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem",
                  fontFamily: "monospace",
                  wordBreak: "break-all",
                  border: "1px solid #e5e7eb",
                }}
              >
                {account.apiKey}
              </code>
              <button
                onClick={() => copyToClipboard(account.apiKey!, "jwtApiKey")}
                style={{
                  padding: "0.75rem 1rem",
                  backgroundColor:
                    copied === "jwtApiKey" ? "#10b981" : "#2563eb",
                  color: "#fff",
                  border: "none",
                  borderRadius: "0.375rem",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                }}
              >
                {copied === "jwtApiKey" ? "✓ Copied!" : "Copy"}
              </button>
            </div>
          </div>
        )}

        {/* API Keys List */}
        <div>
          <div
            style={{
              fontSize: "0.875rem",
              color: "#6b7280",
              marginBottom: "0.5rem",
              fontWeight: 600,
            }}
          >
            API Keys ({apiKeys.length})
          </div>
          <p
            style={{
              fontSize: "0.875rem",
              color: "#6b7280",
              marginBottom: "1rem",
            }}
          >
            Server keys (sk_) and publishable keys (pk_). When using these
            keys, you'll need to provide tenantId and projectId in SDK config.
          </p>
          {loadingApiKeys ? (
            <div
              style={{
                padding: "1rem",
                textAlign: "center",
                color: "#6b7280",
              }}
            >
              Loading API keys...
            </div>
          ) : apiKeys.length > 0 ? (
            <div style={{ display: "grid", gap: "1rem" }}>
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  style={{
                    padding: "1rem",
                    backgroundColor: "#f9fafb",
                    borderRadius: "0.375rem",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "start",
                      marginBottom: "0.75rem",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "1rem",
                          fontWeight: 600,
                          color: "#111827",
                          marginBottom: "0.25rem",
                        }}
                      >
                        {key.name}
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <span
                          style={{
                            padding: "0.25rem 0.5rem",
                            borderRadius: "0.25rem",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            backgroundColor:
                              key.keyPrefix === "sk_" ? "#dbeafe" : "#fce7f3",
                            color:
                              key.keyPrefix === "sk_" ? "#1e40af" : "#9f1239",
                          }}
                        >
                          {key.keyPrefix === "sk_" ? "Server Key" : "Publishable Key"}
                        </span>
                        {key.revoked && (
                          <span
                            style={{
                              padding: "0.25rem 0.5rem",
                              borderRadius: "0.25rem",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              backgroundColor: "#fee2e2",
                              color: "#991b1b",
                            }}
                          >
                            Revoked
                          </span>
                        )}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#6b7280",
                      }}
                    >
                      Created: {new Date(key.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  {/* Tenant ID and Project ID */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "0.75rem",
                      marginTop: "0.75rem",
                      paddingTop: "0.75rem",
                      borderTop: "1px solid #e5e7eb",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "#6b7280",
                          marginBottom: "0.25rem",
                          fontWeight: 600,
                        }}
                      >
                        Tenant ID
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <code
                          style={{
                            fontSize: "0.75rem",
                            fontFamily: "monospace",
                            color: "#111827",
                            flex: 1,
                            wordBreak: "break-all",
                          }}
                        >
                          {key.tenantId}
                        </code>
                        <button
                          onClick={() =>
                            copyToClipboard(key.tenantId, `tenant-${key.id}`)
                          }
                          style={{
                            padding: "0.25rem 0.5rem",
                            backgroundColor:
                              copied === `tenant-${key.id}` ? "#10b981" : "#e5e7eb",
                            color:
                              copied === `tenant-${key.id}` ? "#fff" : "#111827",
                            border: "none",
                            borderRadius: "0.25rem",
                            cursor: "pointer",
                            fontSize: "0.75rem",
                          }}
                        >
                          {copied === `tenant-${key.id}` ? "✓" : "Copy"}
                        </button>
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "#6b7280",
                          marginBottom: "0.25rem",
                          fontWeight: 600,
                        }}
                      >
                        Project ID {key.projectId ? "" : "(Tenant-level)"}
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <code
                          style={{
                            fontSize: "0.75rem",
                            fontFamily: "monospace",
                            color: key.projectId ? "#111827" : "#6b7280",
                            flex: 1,
                            wordBreak: "break-all",
                          }}
                        >
                          {key.projectId || "N/A"}
                        </code>
                        {key.projectId && (
                          <button
                            onClick={() =>
                              copyToClipboard(key.projectId!, `project-${key.id}`)
                            }
                            style={{
                              padding: "0.25rem 0.5rem",
                              backgroundColor:
                                copied === `project-${key.id}` ? "#10b981" : "#e5e7eb",
                              color:
                                copied === `project-${key.id}` ? "#fff" : "#111827",
                              border: "none",
                              borderRadius: "0.25rem",
                              cursor: "pointer",
                              fontSize: "0.75rem",
                            }}
                          >
                            {copied === `project-${key.id}` ? "✓" : "Copy"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* SDK Usage Hint */}
                  {!key.revoked && (
                    <div
                      style={{
                        marginTop: "0.75rem",
                        padding: "0.75rem",
                        backgroundColor: "#fef3c7",
                        borderRadius: "0.375rem",
                        fontSize: "0.75rem",
                        color: "#92400e",
                      }}
                    >
                      <strong>SDK Usage:</strong> When using this key, provide{" "}
                      <code style={{ fontSize: "0.75rem" }}>tenantId</code> and{" "}
                      {key.projectId && (
                        <>
                          <code style={{ fontSize: "0.75rem" }}>projectId</code>{" "}
                        </>
                      )}
                      in SDK config. See Quick Start section below.
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: "1rem",
                backgroundColor: "#f9fafb",
                borderRadius: "0.375rem",
                color: "#6b7280",
                fontSize: "0.875rem",
                textAlign: "center",
              }}
            >
              No API keys found. Create your first API key above.
            </div>
          )}
        </div>
      </div>

      {/* Create API Key Modal */}
      {showCreateForm && (
        <CreateApiKeyModal
          account={account}
          projects={account.projects}
          onClose={() => {
            setShowCreateForm(false);
            setNewApiKey(null);
          }}
          onCreate={createApiKey}
          creating={creating}
        />
      )}

      {/* New API Key Display */}
      {newApiKey && newApiKey.apiKey && (
        <NewApiKeyDisplay
          apiKey={newApiKey}
          account={account}
          onClose={() => setNewApiKey(null)}
          onCopy={copyToClipboard}
          copied={copied}
        />
      )}

      {/* Company Information */}
      <div
        style={{
          backgroundColor: "#fff",
          padding: "1.5rem",
          borderRadius: "0.5rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          marginBottom: "1.5rem",
        }}
      >
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: "bold",
            color: "#111827",
            marginBottom: "1rem",
          }}
        >
          Company Information
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "1rem",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "#6b7280",
                marginBottom: "0.25rem",
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              Company Name
            </div>
            <div
              style={{
                fontSize: "1rem",
                color: "#111827",
                fontWeight: 500,
              }}
            >
              {account.tenant.name}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "#6b7280",
                marginBottom: "0.25rem",
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              Tenant ID
            </div>
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                alignItems: "center",
              }}
            >
              <code
                style={{
                  fontSize: "0.875rem",
                  fontFamily: "monospace",
                  color: "#111827",
                }}
              >
                {account.tenant.id}
              </code>
              <button
                onClick={() => copyToClipboard(account.tenant.id, "tenantId")}
                style={{
                  padding: "0.25rem 0.5rem",
                  backgroundColor: copied === "tenantId" ? "#10b981" : "#e5e7eb",
                  color: copied === "tenantId" ? "#fff" : "#111827",
                  border: "none",
                  borderRadius: "0.25rem",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                }}
              >
                {copied === "tenantId" ? "✓" : "Copy"}
              </button>
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "#6b7280",
                marginBottom: "0.25rem",
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              Plan
            </div>
            <div
              style={{
                fontSize: "1rem",
                color: "#111827",
                fontWeight: 500,
              }}
            >
              <span
                style={{
                  padding: "0.25rem 0.75rem",
                  borderRadius: "9999px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  backgroundColor:
                    account.tenant.plan === "enterprise"
                      ? "#e9d5ff"
                      : account.tenant.plan === "pro"
                      ? "#bfdbfe"
                      : "#d1fae5",
                  color:
                    account.tenant.plan === "enterprise"
                      ? "#7e22ce"
                      : account.tenant.plan === "pro"
                      ? "#1e40af"
                      : "#065f46",
                }}
              >
                {account.tenant.plan.toUpperCase()}
              </span>
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "#6b7280",
                marginBottom: "0.25rem",
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              Company Slug
            </div>
            <div
              style={{
                fontSize: "1rem",
                color: "#111827",
                fontWeight: 500,
              }}
            >
              {account.tenant.slug}
            </div>
          </div>
        </div>
      </div>

      {/* User Information */}
      <div
        style={{
          backgroundColor: "#fff",
          padding: "1.5rem",
          borderRadius: "0.5rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          marginBottom: "1.5rem",
        }}
      >
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: "bold",
            color: "#111827",
            marginBottom: "1rem",
          }}
        >
          User Information
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "1rem",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "#6b7280",
                marginBottom: "0.25rem",
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              Email
            </div>
            <div
              style={{
                fontSize: "1rem",
                color: "#111827",
                fontWeight: 500,
              }}
            >
              {account.user.email}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "#6b7280",
                marginBottom: "0.25rem",
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              User ID
            </div>
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                alignItems: "center",
              }}
            >
              <code
                style={{
                  fontSize: "0.875rem",
                  fontFamily: "monospace",
                  color: "#111827",
                }}
              >
                {account.user.id.substring(0, 20)}...
              </code>
              <button
                onClick={() => copyToClipboard(account.user.id, "userId")}
                style={{
                  padding: "0.25rem 0.5rem",
                  backgroundColor: copied === "userId" ? "#10b981" : "#e5e7eb",
                  color: copied === "userId" ? "#fff" : "#111827",
                  border: "none",
                  borderRadius: "0.25rem",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                }}
              >
                {copied === "userId" ? "✓" : "Copy"}
              </button>
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "#6b7280",
                marginBottom: "0.25rem",
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              Account Created
            </div>
            <div
              style={{
                fontSize: "0.875rem",
                color: "#111827",
              }}
            >
              {new Date(account.user.createdAt).toLocaleDateString()}
            </div>
          </div>
          {account.user.lastLoginAt && (
            <div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "#6b7280",
                  marginBottom: "0.25rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                Last Login
              </div>
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "#111827",
                }}
              >
                {new Date(account.user.lastLoginAt).toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Projects */}
      <div
        style={{
          backgroundColor: "#fff",
          padding: "1.5rem",
          borderRadius: "0.5rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          marginBottom: "1.5rem",
        }}
      >
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: "bold",
            color: "#111827",
            marginBottom: "1rem",
          }}
        >
          Projects
        </h2>
        {account.projects.length > 0 ? (
          <div
            style={{
              display: "grid",
              gap: "1rem",
            }}
          >
            {account.projects.map((project) => (
              <div
                key={project.id}
                style={{
                  padding: "1rem",
                  backgroundColor: "#f9fafb",
                  borderRadius: "0.375rem",
                  border: "1px solid #e5e7eb",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      fontSize: "1rem",
                      fontWeight: 600,
                      color: "#111827",
                    }}
                  >
                    {project.name}
                  </div>
                  <span
                    style={{
                      padding: "0.25rem 0.75rem",
                      borderRadius: "9999px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      backgroundColor:
                        project.environment === "prod" ? "#d1fae5" : "#fef3c7",
                      color:
                        project.environment === "prod" ? "#065f46" : "#92400e",
                    }}
                  >
                    {project.environment.toUpperCase()}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "center",
                  }}
                >
                  <code
                    style={{
                      fontSize: "0.75rem",
                      fontFamily: "monospace",
                      color: "#6b7280",
                    }}
                  >
                    {project.id}
                  </code>
                  <button
                    onClick={() => copyToClipboard(project.id, `project-${project.id}`)}
                    style={{
                      padding: "0.25rem 0.5rem",
                      backgroundColor:
                        copied === `project-${project.id}` ? "#10b981" : "#e5e7eb",
                      color:
                        copied === `project-${project.id}` ? "#fff" : "#111827",
                      border: "none",
                      borderRadius: "0.25rem",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                    }}
                  >
                    {copied === `project-${project.id}` ? "✓" : "Copy"}
                  </button>
                </div>
                {account.defaultProject?.id === project.id && (
                  <div
                    style={{
                      marginTop: "0.5rem",
                      fontSize: "0.75rem",
                      color: "#2563eb",
                      fontWeight: 500,
                    }}
                  >
                    Default Project (used for API key)
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: "1rem",
              backgroundColor: "#f9fafb",
              borderRadius: "0.375rem",
              color: "#6b7280",
              fontSize: "0.875rem",
            }}
          >
            No projects found
          </div>
        )}
      </div>

      {/* API Information */}
      <div
        style={{
          backgroundColor: "#fff",
          padding: "1.5rem",
          borderRadius: "0.5rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          marginBottom: "1.5rem",
        }}
      >
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: "bold",
            color: "#111827",
            marginBottom: "1rem",
          }}
        >
          API Information
        </h2>
        <div
          style={{
            display: "grid",
            gap: "1rem",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "#6b7280",
                marginBottom: "0.25rem",
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              Observa API URL
            </div>
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                alignItems: "center",
              }}
            >
              <code
                style={{
                  fontSize: "0.875rem",
                  fontFamily: "monospace",
                  color: "#111827",
                }}
              >
                {account.observaApiUrl}
              </code>
              <button
                onClick={() => copyToClipboard(account.observaApiUrl, "apiUrl")}
                style={{
                  padding: "0.25rem 0.5rem",
                  backgroundColor: copied === "apiUrl" ? "#10b981" : "#e5e7eb",
                  color: copied === "apiUrl" ? "#fff" : "#111827",
                  border: "none",
                  borderRadius: "0.25rem",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                }}
              >
                {copied === "apiUrl" ? "✓" : "Copy"}
              </button>
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "#6b7280",
                marginBottom: "0.25rem",
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              Integration Status
            </div>
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  padding: "0.25rem 0.75rem",
                  borderRadius: "9999px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  backgroundColor: account.hasTinybirdToken ? "#d1fae5" : "#fee2e2",
                  color: account.hasTinybirdToken ? "#065f46" : "#991b1b",
                }}
              >
                {account.hasTinybirdToken ? "✓ Tinybird Connected" : "⚠ Tinybird Not Connected"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Start Guide */}
      <div
        style={{
          backgroundColor: "#f0f9ff",
          padding: "1.5rem",
          borderRadius: "0.5rem",
          border: "1px solid #bfdbfe",
        }}
      >
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: "bold",
            color: "#111827",
            marginBottom: "1rem",
          }}
        >
          Quick Start
        </h2>
        <div
          style={{
            fontSize: "0.875rem",
            color: "#1e40af",
            lineHeight: "1.6",
          }}
        >
          <p style={{ marginBottom: "0.5rem" }}>
            <strong>1. Install Observa SDK:</strong>
          </p>
          <code
            style={{
              display: "block",
              padding: "0.5rem",
              backgroundColor: "#fff",
              borderRadius: "0.25rem",
              marginBottom: "1rem",
              fontFamily: "monospace",
            }}
          >
            npm install observa-sdk
          </code>
          <p style={{ marginBottom: "0.5rem" }}>
            <strong>2. Initialize in your app:</strong>
          </p>
          <code
            style={{
              display: "block",
              padding: "0.5rem",
              backgroundColor: "#fff",
              borderRadius: "0.25rem",
              marginBottom: "1rem",
              fontFamily: "monospace",
              whiteSpace: "pre-wrap",
            }}
          >
            {`import { init } from 'observa-sdk';

const observa = init({
  apiKey: '${account.apiKey || "YOUR_API_KEY"}',
  apiUrl: '${account.observaApiUrl}',
});`}
          </code>
          <p style={{ marginBottom: "0.5rem" }}>
            <strong>3. Track your LLM calls:</strong>
          </p>
          <code
            style={{
              display: "block",
              padding: "0.5rem",
              backgroundColor: "#fff",
              borderRadius: "0.25rem",
              fontFamily: "monospace",
              whiteSpace: "pre-wrap",
            }}
          >
            {`await observa.track({
  query: "User question",
  context: "Retrieved context",
  response: "AI response",
  conversationId: "conv-123",
  messageIndex: 1
}, async () => {
  // Your LLM call here
  return await yourLLMCall();
});`}
          </code>
        </div>
      </div>
    </div>
  );
}

