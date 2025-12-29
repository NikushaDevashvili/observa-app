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

export default function TracesPage() {
  const [traces, setTraces] = useState<Trace[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false,
  })

  useEffect(() => {
    fetchTraces()
  }, [filter, pagination.offset])

  const fetchTraces = async () => {
    try {
      const token = localStorage.getItem('sessionToken')
      if (!token) return

      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
      })

      if (filter !== 'all') {
        params.append('issueType', filter)
      }

      const response = await fetch(`/api/traces?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.traces) {
          setTraces(data.traces)
          setPagination(prev => ({
            ...prev,
            total: data.pagination?.total || 0,
            hasMore: data.pagination?.hasMore || false,
          }))
        }
      }
    } catch (error) {
      console.error('Failed to fetch traces:', error)
    } finally {
      setLoading(false)
    }
  }

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
        <div>Loading traces...</div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
            Traces
          </h1>
          <p style={{ color: '#6b7280' }}>
            {pagination.total} total trace{pagination.total !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        backgroundColor: '#fff',
        padding: '1rem',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '1.5rem',
        display: 'flex',
        gap: '0.5rem',
        flexWrap: 'wrap',
      }}>
        <button
          onClick={() => {
            setFilter('all')
            setPagination(prev => ({ ...prev, offset: 0 }))
          }}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 500,
            backgroundColor: filter === 'all' ? '#2563eb' : '#f3f4f6',
            color: filter === 'all' ? '#fff' : '#4b5563',
          }}
        >
          All
        </button>
        <button
          onClick={() => {
            setFilter('hallucination')
            setPagination(prev => ({ ...prev, offset: 0 }))
          }}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 500,
            backgroundColor: filter === 'hallucination' ? '#ef4444' : '#f3f4f6',
            color: filter === 'hallucination' ? '#fff' : '#4b5563',
          }}
        >
          Hallucinations
        </button>
        <button
          onClick={() => {
            setFilter('context_drop')
            setPagination(prev => ({ ...prev, offset: 0 }))
          }}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 500,
            backgroundColor: filter === 'context_drop' ? '#f59e0b' : '#f3f4f6',
            color: filter === 'context_drop' ? '#fff' : '#4b5563',
          }}
        >
          Context Drops
        </button>
        <button
          onClick={() => {
            setFilter('faithfulness')
            setPagination(prev => ({ ...prev, offset: 0 }))
          }}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 500,
            backgroundColor: filter === 'faithfulness' ? '#8b5cf6' : '#f3f4f6',
            color: filter === 'faithfulness' ? '#fff' : '#4b5563',
          }}
        >
          Faithfulness Issues
        </button>
        <button
          onClick={() => {
            setFilter('drift')
            setPagination(prev => ({ ...prev, offset: 0 }))
          }}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 500,
            backgroundColor: filter === 'drift' ? '#ec4899' : '#f3f4f6',
            color: filter === 'drift' ? '#fff' : '#4b5563',
          }}
        >
          Model Drift
        </button>
        <button
          onClick={() => {
            setFilter('cost_anomaly')
            setPagination(prev => ({ ...prev, offset: 0 }))
          }}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 500,
            backgroundColor: filter === 'cost_anomaly' ? '#14b8a6' : '#f3f4f6',
            color: filter === 'cost_anomaly' ? '#fff' : '#4b5563',
          }}
        >
          Cost Anomalies
        </button>
      </div>

      {/* Traces Table */}
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden',
      }}>
        {traces.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
            <p>No traces found{filter !== 'all' ? ` with ${filter} issues` : ''}.</p>
          </div>
        ) : (
          <>
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
                          {trace.trace_id}
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
                            <span style={{ color: '#10b981', fontSize: '0.75rem' }}>✓ No issues</span>
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

            {/* Pagination */}
            {pagination.total > pagination.limit && (
              <div style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid #e5e5e5',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Showing {pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))}
                    disabled={pagination.offset === 0}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #d1d5db',
                      backgroundColor: pagination.offset === 0 ? '#f3f4f6' : '#fff',
                      color: pagination.offset === 0 ? '#9ca3af' : '#4b5563',
                      cursor: pagination.offset === 0 ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                    }}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
                    disabled={!pagination.hasMore}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #d1d5db',
                      backgroundColor: !pagination.hasMore ? '#f3f4f6' : '#fff',
                      color: !pagination.hasMore ? '#9ca3af' : '#4b5563',
                      cursor: !pagination.hasMore ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

