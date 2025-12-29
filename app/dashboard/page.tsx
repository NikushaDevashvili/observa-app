'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Trace {
  trace_id: string
  is_hallucination: boolean | null
  hallucination_confidence: number | null
  has_context_drop: boolean
  has_faithfulness_issue: boolean
  has_model_drift: boolean
  has_cost_anomaly: boolean
  context_relevance_score: string | null
  answer_faithfulness_score: number | null
  analyzed_at: string
}

export default function DashboardPage() {
  const [traces, setTraces] = useState<Trace[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    hallucinations: 0,
    contextDrops: 0,
    faithfulnessIssues: 0,
    modelDrift: 0,
    costAnomalies: 0,
  })

  useEffect(() => {
    const fetchTraces = async () => {
      try {
        const token = localStorage.getItem('sessionToken')
        if (!token) return

        const response = await fetch('/api/traces?limit=10', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.traces) {
            setTraces(data.traces)
            
            // Calculate stats
            const total = data.pagination?.total || data.traces.length
            const hallucinations = data.traces.filter((t: Trace) => t.is_hallucination === true).length
            const contextDrops = data.traces.filter((t: Trace) => t.has_context_drop === true).length
            const faithfulnessIssues = data.traces.filter((t: Trace) => t.has_faithfulness_issue === true).length
            const modelDrift = data.traces.filter((t: Trace) => t.has_model_drift === true).length
            const costAnomalies = data.traces.filter((t: Trace) => t.has_cost_anomaly === true).length

            setStats({
              total,
              hallucinations,
              contextDrops,
              faithfulnessIssues,
              modelDrift,
              costAnomalies,
            })
          }
        }
      } catch (error) {
        console.error('Failed to fetch traces:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTraces()
  }, [])

  const StatCard = ({ title, value, subtitle, color }: { title: string; value: number; subtitle?: string; color: string }) => (
    <div style={{
      backgroundColor: '#fff',
      padding: '1.5rem',
      borderRadius: '0.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      borderLeft: `4px solid ${color}`,
    }}>
      <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>{title}</div>
      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.25rem' }}>{value}</div>
      {subtitle && <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{subtitle}</div>}
    </div>
  )

  const IssueBadge = ({ hasIssue, label }: { hasIssue: boolean; label: string }) => {
    if (!hasIssue) return null
    return (
      <span style={{
        display: 'inline-block',
        padding: '0.25rem 0.5rem',
        backgroundColor: '#fee2e2',
        color: '#991b1b',
        borderRadius: '0.25rem',
        fontSize: '0.75rem',
        fontWeight: 500,
        marginRight: '0.5rem',
      }}>
        {label}
      </span>
    )
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div>Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
          Dashboard
        </h1>
        <p style={{ color: '#6b7280' }}>Monitor your AI application's performance and quality</p>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem',
      }}>
        <StatCard
          title="Total Traces"
          value={stats.total}
          color="#3b82f6"
        />
        <StatCard
          title="Hallucinations"
          value={stats.hallucinations}
          subtitle={stats.total > 0 ? `${Math.round((stats.hallucinations / stats.total) * 100)}%` : '0%'}
          color="#ef4444"
        />
        <StatCard
          title="Context Drops"
          value={stats.contextDrops}
          subtitle={stats.total > 0 ? `${Math.round((stats.contextDrops / stats.total) * 100)}%` : '0%'}
          color="#f59e0b"
        />
        <StatCard
          title="Faithfulness Issues"
          value={stats.faithfulnessIssues}
          subtitle={stats.total > 0 ? `${Math.round((stats.faithfulnessIssues / stats.total) * 100)}%` : '0%'}
          color="#8b5cf6"
        />
        <StatCard
          title="Model Drift"
          value={stats.modelDrift}
          subtitle={stats.total > 0 ? `${Math.round((stats.modelDrift / stats.total) * 100)}%` : '0%'}
          color="#ec4899"
        />
        <StatCard
          title="Cost Anomalies"
          value={stats.costAnomalies}
          subtitle={stats.total > 0 ? `${Math.round((stats.costAnomalies / stats.total) * 100)}%` : '0%'}
          color="#14b8a6"
        />
      </div>

      {/* Recent Traces */}
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e5e5e5',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' }}>Recent Traces</h2>
          <Link
            href="/dashboard/traces"
            style={{
              color: '#2563eb',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            View All →
          </Link>
        </div>

        {traces.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
            <p>No traces yet. Start sending traces to see analysis results here.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e5e5' }}>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#6b7280' }}>Trace ID</th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#6b7280' }}>Issues</th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#6b7280' }}>Confidence</th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#6b7280' }}>Analyzed</th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#6b7280' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {traces.map((trace) => (
                  <tr key={trace.trace_id} style={{ borderBottom: '1px solid #e5e5e5' }}>
                    <td style={{ padding: '0.75rem 1.5rem', fontSize: '0.875rem', color: '#111827' }}>
                      <code style={{ backgroundColor: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem' }}>
                        {trace.trace_id.substring(0, 12)}...
                      </code>
                    </td>
                    <td style={{ padding: '0.75rem 1.5rem' }}>
                      <div>
                        <IssueBadge hasIssue={trace.is_hallucination === true} label="Hallucination" />
                        <IssueBadge hasIssue={trace.has_context_drop} label="Context Drop" />
                        <IssueBadge hasIssue={trace.has_faithfulness_issue} label="Faithfulness" />
                        <IssueBadge hasIssue={trace.has_model_drift} label="Drift" />
                        <IssueBadge hasIssue={trace.has_cost_anomaly} label="Cost" />
                        {!trace.is_hallucination && !trace.has_context_drop && !trace.has_faithfulness_issue && !trace.has_model_drift && !trace.has_cost_anomaly && (
                          <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>No issues</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      {trace.hallucination_confidence !== null ? (
                        <span style={{ color: trace.hallucination_confidence > 0.7 ? '#ef4444' : '#6b7280' }}>
                          {(trace.hallucination_confidence * 100).toFixed(0)}%
                        </span>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      {new Date(trace.analyzed_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.75rem 1.5rem' }}>
                      <Link
                        href={`/dashboard/traces/${trace.trace_id}`}
                        style={{
                          color: '#2563eb',
                          textDecoration: 'none',
                          fontSize: '0.875rem',
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
        )}
      </div>
    </div>
  )
}

