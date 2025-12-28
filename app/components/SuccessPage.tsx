'use client'

import { useState } from 'react'

interface SuccessPageProps {
  data: {
    apiKey: string
    tenantId: string
    projectId: string
    environment: string
    message: string
  }
  onBack: () => void
}

export default function SuccessPage({ data, onBack }: SuccessPageProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(data.apiKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.successIcon}>✓</div>
        <h1 style={styles.title}>Welcome to Observa!</h1>
        <p style={styles.message}>{data.message}</p>

        <div style={styles.apiKeySection}>
          <label style={styles.label}>Your API Key</label>
          <div style={styles.apiKeyContainer}>
            <code style={styles.apiKey}>{data.apiKey}</code>
            <button
              onClick={copyToClipboard}
              style={copied ? { ...styles.copyButton, ...styles.copied } : styles.copyButton}
            >
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div style={styles.infoSection}>
          <div style={styles.infoItem}>
            <strong>Tenant ID:</strong> <code>{data.tenantId}</code>
          </div>
          <div style={styles.infoItem}>
            <strong>Project ID:</strong> <code>{data.projectId}</code>
          </div>
          <div style={styles.infoItem}>
            <strong>Environment:</strong> <code>{data.environment}</code>
          </div>
        </div>

        <div style={styles.quickStart}>
          <h2 style={styles.quickStartTitle}>Quick Start</h2>
          <ol style={styles.steps}>
            <li>
              <strong>Install the SDK:</strong>
              <pre style={styles.codeBlock}>
                <code>npm install observa-sdk</code>
              </pre>
            </li>
            <li>
              <strong>Initialize in your code:</strong>
              <pre style={styles.codeBlock}>
                <code>{`import { init } from "observa-sdk";

const observa = init({
  apiKey: "${data.apiKey.substring(0, 30)}...",
});`}</code>
              </pre>
            </li>
            <li>
              <strong>Start tracking:</strong>
              <pre style={styles.codeBlock}>
                <code>{`const response = await observa.track(
  { query: "Your query here" },
  () => fetch("https://api.openai.com/...")
);`}</code>
              </pre>
            </li>
          </ol>
        </div>

        <div style={styles.actions}>
          <a
            href="https://github.com/your-org/observa-sdk"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.linkButton}
          >
            View Documentation
          </a>
          <button onClick={onBack} style={styles.backButton}>
            Sign Up Another Account
          </button>
        </div>
      </div>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: '100%',
    maxWidth: '800px',
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    padding: '40px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  },
  successIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    fontSize: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
    fontWeight: 'bold',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#1a202c',
    textAlign: 'center',
  },
  message: {
    fontSize: '16px',
    color: '#718096',
    marginBottom: '32px',
    textAlign: 'center',
  },
  apiKeySection: {
    marginBottom: '32px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '8px',
    display: 'block',
  },
  apiKeyContainer: {
    display: 'flex',
    gap: '12px',
    alignItems: 'stretch',
  },
  apiKey: {
    flex: 1,
    padding: '12px 16px',
    backgroundColor: '#f7fafc',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'monospace',
    wordBreak: 'break-all',
    overflowWrap: 'break-word',
  },
  copyButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    color: 'white',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'transform 0.2s',
  },
  copied: {
    background: '#48bb78',
  },
  infoSection: {
    backgroundColor: '#f7fafc',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '32px',
  },
  infoItem: {
    marginBottom: '12px',
    fontSize: '14px',
    color: '#2d3748',
  },
  infoItem: {
    marginBottom: '12px',
    fontSize: '14px',
    color: '#2d3748',
  },
  quickStart: {
    marginBottom: '32px',
  },
  quickStartTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '16px',
    color: '#1a202c',
  },
  steps: {
    paddingLeft: '20px',
  },
  steps: {
    paddingLeft: '20px',
  },
  steps: {
    paddingLeft: '20px',
  },
  steps: {
    paddingLeft: '20px',
  },
  steps: {
    paddingLeft: '20px',
  },
  steps: {
    paddingLeft: '20px',
  },
  steps: {
    paddingLeft: '20px',
  },
  steps: {
    paddingLeft: '20px',
  },
  steps: {
    paddingLeft: '20px',
  },
  steps: {
    paddingLeft: '20px',
  },
  steps: {
    paddingLeft: '20px',
  },
  steps: {
    paddingLeft: '20px',
  },
  steps: {
    paddingLeft: '20px',
  },
  steps: {
    paddingLeft: '20px',
  },
  steps: {
    paddingLeft: '20px',
  },
  steps: {
    paddingLeft: '20px',
  },
  steps: {
    paddingLeft: '20px',
  },
  steps: {
    paddingLeft: '20px',
  },
  steps: {
    paddingLeft: '20px',
  },
  steps: {
    paddingLeft: '20px',
  },
  steps: {
    paddingLeft: '20px',
  },
  steps: {
    paddingLeft: '20px',
  },
  steps: {
    paddingLeft: '20px',
  },
  steps: {
    paddingLeft: '20px',
  },
  steps: {
    paddingLeft: '20px',
  },
  steps: {
    paddingLeft: '20px',
  },
  steps: {
    paddingLeft: '20px',
  },
  steps: {
    paddingLeft: '20px',
  },
  steps: {
    paddingLeft: '20px',
  },
  steps: {
    paddingLeft: '20px',
  },
  steps: {
    paddingLeft: '20px',
  },
  steps: {
    paddingLeft: '20px',
  },
  steps: {
    paddingLeft: '20px',
  },
  steps: {
    paddingLeft: '20px',
  },
  steps: {
    paddingLeft: '20px',
  },
  steps: {
    paddingLeft: '20px',
  },
  steps: {
    paddingLeft: '20px',
  },
  steps: {
    paddingLeft: '20px',
  },
  steps: {
    paddingLeft: '20px',
  },
  steps: {
    paddingLeft: '20px',
  },
  codeBlock: {
    backgroundColor: '#1a202c',
    color: '#e2e8f0',
    padding: '16px',
    borderRadius: '8px',
    overflow: 'auto',
    marginTop: '8px',
    fontSize: '14px',
    fontFamily: 'monospace',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  linkButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    color: 'white',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '8px',
    textDecoration: 'none',
    display: 'inline-block',
    transition: 'transform 0.2s',
  },
  backButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#667eea',
    background: 'white',
    border: '2px solid #667eea',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
}

