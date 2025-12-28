'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

export default function DocumentationPage() {
  const [activeSection, setActiveSection] = useState('getting-started')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Override body styles for docs page
  useEffect(() => {
    document.body.style.background = '#ffffff'
    document.body.style.display = 'block'
    document.body.style.padding = '0'
    document.body.style.alignItems = 'unset'
    document.body.style.justifyContent = 'unset'

    return () => {
      // Restore default styles when leaving
      document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      document.body.style.display = 'flex'
      document.body.style.padding = '20px'
      document.body.style.alignItems = 'center'
      document.body.style.justifyContent = 'center'
    }
  }, [])

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const sections = [
    { id: 'getting-started', title: 'Getting Started', icon: '🚀' },
    { id: 'installation', title: 'Installation', icon: '📦' },
    { id: 'authentication', title: 'Authentication', icon: '🔐' },
    { id: 'tracking', title: 'Tracking Events', icon: '📊' },
    { id: 'api-reference', title: 'API Reference', icon: '📚' },
    { id: 'examples', title: 'Examples', icon: '💡' },
    { id: 'best-practices', title: 'Best Practices', icon: '⭐' },
    { id: 'troubleshooting', title: 'Troubleshooting', icon: '🔧' },
  ]

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <Link href="/" style={styles.logo}>
            <span style={styles.logoIcon}>🔍</span>
            <span style={styles.logoText}>Observa</span>
          </Link>
          {isMobile && (
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={styles.mobileMenuButton}
              aria-label="Toggle menu"
            >
              ☰
            </button>
          )}
        </div>
      </header>

      <div style={styles.mainContainer}>
        {/* Overlay for mobile menu */}
        {isMobile && isMobileMenuOpen && (
          <div
            style={styles.overlay}
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
        {/* Sidebar */}
        <aside
          style={{
            ...styles.sidebar,
            ...(isMobile ? styles.sidebarMobile : {}),
            ...(isMobile && isMobileMenuOpen ? styles.sidebarOpen : {}),
          }}
        >
          <nav style={styles.nav}>
            <div style={styles.navHeader}>Documentation</div>
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                onClick={(e) => {
                  e.preventDefault()
                  setActiveSection(section.id)
                  setIsMobileMenuOpen(false)
                  document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' })
                }}
                style={{
                  ...styles.navItem,
                  ...(activeSection === section.id ? styles.navItemActive : {}),
                }}
              >
                <span style={styles.navIcon}>{section.icon}</span>
                {section.title}
              </a>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main style={{ ...styles.content, ...(isMobile ? styles.contentMobile : {}) }}>
          <div style={styles.contentInner}>
            {/* Getting Started */}
            <Section
              id="getting-started"
              title="Getting Started"
              onVisible={() => setActiveSection('getting-started')}
            >
              <p style={styles.paragraph}>
                Welcome to Observa! This guide will help you get started with AI observability in
                just a few minutes.
              </p>
              <p style={styles.paragraph}>
                Observa provides enterprise-grade observability for your AI applications, allowing
                you to track, monitor, and optimize your AI workflows with ease.
              </p>
              <div style={styles.highlightBox}>
                <strong>New to Observa?</strong> Start with the{' '}
                <a href="#installation" style={styles.link}>
                  Installation
                </a>{' '}
                guide to set up the SDK in your project.
              </div>
            </Section>

            {/* Installation */}
            <Section
              id="installation"
              title="Installation"
              onVisible={() => setActiveSection('installation')}
            >
              <p style={styles.paragraph}>
                Install the Observa SDK using npm, yarn, or pnpm:
              </p>
              <CodeBlock language="bash">
                npm install observa-sdk
              </CodeBlock>
              <p style={styles.paragraph}>
                Or with yarn:
              </p>
              <CodeBlock language="bash">
                yarn add observa-sdk
              </CodeBlock>
              <p style={styles.paragraph}>
                Or with pnpm:
              </p>
              <CodeBlock language="bash">
                pnpm add observa-sdk
              </CodeBlock>
            </Section>

            {/* Authentication */}
            <Section
              id="authentication"
              title="Authentication"
              onVisible={() => setActiveSection('authentication')}
            >
              <p style={styles.paragraph}>
                To use Observa, you need an API key. Get your API key from the{' '}
                <Link href="/" style={styles.link}>
                  signup page
                </Link>{' '}
                or your dashboard.
              </p>
              <p style={styles.paragraph}>
                Initialize the SDK with your API key:
              </p>
              <CodeBlock language="typescript">
                {`import { init } from 'observa-sdk'

const observa = init({
  apiKey: 'your-api-key-here',
  // Optional: Set your tenant and project IDs
  tenantId: 'your-tenant-id',
  projectId: 'your-project-id',
})`}
              </CodeBlock>
              <div style={styles.warningBox}>
                <strong>⚠️ Keep your API key secure:</strong> Never commit your API key to version
                control. Use environment variables instead.
              </div>
              <CodeBlock language="typescript">
                {`// Use environment variables
const observa = init({
  apiKey: process.env.OBSERVA_API_KEY!,
})`}
              </CodeBlock>
            </Section>

            {/* Tracking Events */}
            <Section
              id="tracking"
              title="Tracking Events"
              onVisible={() => setActiveSection('tracking')}
            >
              <p style={styles.paragraph}>
                Track AI interactions and monitor performance. The <code style={styles.inlineCode}>track</code> method
                wraps your AI calls and automatically captures metrics.
              </p>
              <h3 style={styles.h3}>Basic Tracking</h3>
              <CodeBlock language="typescript">
                {`const response = await observa.track(
  {
    query: "What is the weather today?",
    model: "gpt-4",
    provider: "openai",
  },
  async () => {
    // Your AI API call
    return fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${process.env.OPENAI_API_KEY}\`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'What is the weather today?' }],
      }),
    })
  }
)`}
              </CodeBlock>
              <h3 style={styles.h3}>With Metadata</h3>
              <CodeBlock language="typescript">
                {`await observa.track(
  {
    query: "Translate to French",
    model: "gpt-4",
    provider: "openai",
    userId: "user-123",
    sessionId: "session-456",
    metadata: {
      feature: "translation",
      language: "french",
    },
  },
  () => /* your AI call */
)`}
              </CodeBlock>
            </Section>

            {/* API Reference */}
            <Section
              id="api-reference"
              title="API Reference"
              onVisible={() => setActiveSection('api-reference')}
            >
              <h3 style={styles.h3}>init(options)</h3>
              <p style={styles.paragraph}>Initializes the Observa SDK.</p>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.tableHeader}>Parameter</th>
                    <th style={styles.tableHeader}>Type</th>
                    <th style={styles.tableHeader}>Required</th>
                    <th style={styles.tableHeader}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={styles.tableCell}><code>apiKey</code></td>
                    <td style={styles.tableCell}>string</td>
                    <td style={styles.tableCell}>Yes</td>
                    <td style={styles.tableCell}>Your Observa API key</td>
                  </tr>
                  <tr>
                    <td style={styles.tableCell}><code>tenantId</code></td>
                    <td style={styles.tableCell}>string</td>
                    <td style={styles.tableCell}>No</td>
                    <td style={styles.tableCell}>Your tenant ID</td>
                  </tr>
                  <tr>
                    <td style={styles.tableCell}><code>projectId</code></td>
                    <td style={styles.tableCell}>string</td>
                    <td style={styles.tableCell}>No</td>
                    <td style={styles.tableCell}>Your project ID</td>
                  </tr>
                  <tr>
                    <td style={styles.tableCell}><code>environment</code></td>
                    <td style={styles.tableCell}>string</td>
                    <td style={styles.tableCell}>No</td>
                    <td style={styles.tableCell}>Environment (development, staging, production)</td>
                  </tr>
                </tbody>
              </table>

              <h3 style={styles.h3}>track(event, callback)</h3>
              <p style={styles.paragraph}>
                Tracks an AI interaction and executes the provided callback.
              </p>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.tableHeader}>Parameter</th>
                    <th style={styles.tableHeader}>Type</th>
                    <th style={styles.tableHeader}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={styles.tableCell}><code>event</code></td>
                    <td style={styles.tableCell}>TrackEvent</td>
                    <td style={styles.tableCell}>
                      Event object containing query, model, provider, and optional metadata
                    </td>
                  </tr>
                  <tr>
                    <td style={styles.tableCell}><code>callback</code></td>
                    <td style={styles.tableCell}>() =&gt; Promise&lt;Response&gt;</td>
                    <td style={styles.tableCell}>Function that performs the AI API call</td>
                  </tr>
                </tbody>
              </table>
            </Section>

            {/* Examples */}
            <Section
              id="examples"
              title="Examples"
              onVisible={() => setActiveSection('examples')}
            >
              <h3 style={styles.h3}>OpenAI Integration</h3>
              <CodeBlock language="typescript">
                {`import { init } from 'observa-sdk'

const observa = init({
  apiKey: process.env.OBSERVA_API_KEY!,
})

async function chatCompletion(prompt: string) {
  return observa.track(
    {
      query: prompt,
      model: 'gpt-4',
      provider: 'openai',
      userId: 'user-123',
    },
    async () => {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${process.env.OPENAI_API_KEY}\`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      return response.json()
    }
  )
}`}
              </CodeBlock>

              <h3 style={styles.h3}>Anthropic Integration</h3>
              <CodeBlock language="typescript">
                {`async function claudeCompletion(prompt: string) {
  return observa.track(
    {
      query: prompt,
      model: 'claude-3-opus',
      provider: 'anthropic',
    },
    async () => {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-opus-20240229',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      return response.json()
    }
  )
}`}
              </CodeBlock>
            </Section>

            {/* Best Practices */}
            <Section
              id="best-practices"
              title="Best Practices"
              onVisible={() => setActiveSection('best-practices')}
            >
              <ul style={styles.list}>
                <li>
                  <strong>Use environment variables:</strong> Never hardcode API keys in your
                  source code.
                </li>
                <li>
                  <strong>Include meaningful metadata:</strong> Add context like userId, sessionId,
                  and feature flags to help with debugging.
                </li>
                <li>
                  <strong>Handle errors gracefully:</strong> Wrap tracking calls in try-catch
                  blocks to prevent observability from breaking your application.
                </li>
                <li>
                  <strong>Use appropriate environments:</strong> Set the environment field to
                  differentiate between development, staging, and production.
                </li>
                <li>
                  <strong>Monitor performance:</strong> Review your tracked events regularly to
                  identify bottlenecks and optimization opportunities.
                </li>
              </ul>
              <CodeBlock language="typescript">
                {`// Good: Error handling
try {
  await observa.track(event, callback)
} catch (error) {
  console.error('Tracking failed:', error)
  // Continue with your application logic
  return await callback()
}

// Good: Environment-aware initialization
const observa = init({
  apiKey: process.env.OBSERVA_API_KEY!,
  environment: process.env.NODE_ENV || 'development',
})`}
              </CodeBlock>
            </Section>

            {/* Troubleshooting */}
            <Section
              id="troubleshooting"
              title="Troubleshooting"
              onVisible={() => setActiveSection('troubleshooting')}
            >
              <h3 style={styles.h3}>Common Issues</h3>

              <div style={styles.faqItem}>
                <h4 style={styles.faqQuestion}>Events not appearing in dashboard</h4>
                <p style={styles.paragraph}>
                  Check that your API key is correct and that you're using the correct tenant and
                  project IDs. Verify network connectivity and check browser console for errors.
                </p>
              </div>

              <div style={styles.faqItem}>
                <h4 style={styles.faqQuestion}>SDK initialization fails</h4>
                <p style={styles.paragraph}>
                  Ensure your API key is valid and properly set in environment variables. Check the
                  format of your initialization options.
                </p>
              </div>

              <div style={styles.faqItem}>
                <h4 style={styles.faqQuestion}>Performance impact</h4>
                <p style={styles.paragraph}>
                  The SDK is designed to be non-blocking and lightweight. If you experience
                  performance issues, check that you're not wrapping synchronous operations or
                  blocking calls unnecessarily.
                </p>
              </div>

              <h3 style={styles.h3}>Getting Help</h3>
              <p style={styles.paragraph}>
                If you're still experiencing issues, reach out to our support team or check our{' '}
                <a href="https://github.com/your-org/observa-sdk/issues" style={styles.link} target="_blank" rel="noopener noreferrer">
                  GitHub issues
                </a>
                .
              </p>
            </Section>
          </div>
        </main>
      </div>
    </div>
  )
}

// Section component with intersection observer
function Section({
  id,
  title,
  children,
  onVisible,
}: {
  id: string
  title: string
  children: React.ReactNode
  onVisible?: () => void
}) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && onVisible) {
          onVisible()
        }
      },
      { threshold: 0.3 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [onVisible])

  return (
    <section id={id} ref={ref} style={styles.section}>
      <h2 style={styles.h2}>{title}</h2>
      {children}
    </section>
  )
}

// Code block component
function CodeBlock({ children, language }: { children: string; language?: string }) {
  const [copied, setCopied] = useState(false)

  const copyCode = async () => {
    await navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={styles.codeWrapper}>
      <button onClick={copyCode} style={styles.copyButton}>
        {copied ? '✓ Copied' : 'Copy'}
      </button>
      <pre style={styles.codeBlock}>
        <code>{children}</code>
      </pre>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  headerContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1a202c',
    textDecoration: 'none',
  },
  logoIcon: {
    fontSize: '24px',
  },
  logoText: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  mobileMenuButton: {
    display: 'block',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '8px',
    color: '#1a202c',
  },
  mainContainer: {
    display: 'flex',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  sidebar: {
    width: '280px',
    backgroundColor: '#f7fafc',
    borderRight: '1px solid #e2e8f0',
    position: 'sticky',
    top: '73px',
    height: 'calc(100vh - 73px)',
    overflowY: 'auto',
    padding: '24px 0',
  },
  sidebarMobile: {
    position: 'fixed',
    left: 0,
    top: '73px',
    width: '280px',
    height: 'calc(100vh - 73px)',
    transform: 'translateX(-100%)',
    transition: 'transform 0.3s ease',
    zIndex: 99,
    boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)',
  },
  sidebarOpen: {
    transform: 'translateX(0)',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
  },
  navHeader: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#718096',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    padding: '0 24px 12px',
    marginBottom: '8px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 24px',
    color: '#4a5568',
    textDecoration: 'none',
    fontSize: '14px',
    transition: 'all 0.2s',
    borderLeft: '3px solid transparent',
  },
  navItemActive: {
    backgroundColor: '#edf2f7',
    color: '#667eea',
    borderLeftColor: '#667eea',
    fontWeight: '600',
  },
  navIcon: {
    fontSize: '16px',
  },
  content: {
    flex: 1,
    padding: '48px',
    maxWidth: '900px',
  },
  contentMobile: {
    padding: '24px',
  },
  contentInner: {
    width: '100%',
  },
  section: {
    marginBottom: '64px',
    scrollMarginTop: '100px',
  },
  h2: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '2px solid #e2e8f0',
  },
  h3: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#2d3748',
    marginTop: '32px',
    marginBottom: '16px',
  },
  paragraph: {
    fontSize: '16px',
    lineHeight: '1.7',
    color: '#4a5568',
    marginBottom: '16px',
  },
  inlineCode: {
    backgroundColor: '#f7fafc',
    padding: '2px 6px',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '0.9em',
    color: '#e53e3e',
    border: '1px solid #e2e8f0',
  },
  codeWrapper: {
    position: 'relative',
    marginBottom: '24px',
  },
  codeBlock: {
    backgroundColor: '#1a202c',
    color: '#e2e8f0',
    padding: '24px',
    borderRadius: '8px',
    overflowX: 'auto',
    fontSize: '14px',
    fontFamily: "'Fira Code', 'Monaco', 'Courier New', monospace",
    lineHeight: '1.6',
  },
  copyButton: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: '#2d3748',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  highlightBox: {
    backgroundColor: '#ebf8ff',
    borderLeft: '4px solid #3182ce',
    padding: '16px 20px',
    borderRadius: '4px',
    marginBottom: '24px',
    fontSize: '15px',
    color: '#2c5282',
  },
  warningBox: {
    backgroundColor: '#fffaf0',
    borderLeft: '4px solid #dd6b20',
    padding: '16px 20px',
    borderRadius: '4px',
    marginBottom: '24px',
    fontSize: '15px',
    color: '#7c2d12',
  },
  link: {
    color: '#667eea',
    textDecoration: 'none',
    fontWeight: '500',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '24px',
    fontSize: '14px',
  },
  tableHeader: {
    backgroundColor: '#f7fafc',
    padding: '12px',
    textAlign: 'left',
    fontWeight: '600',
    color: '#2d3748',
    borderBottom: '2px solid #e2e8f0',
  },
  tableCell: {
    padding: '12px',
    borderBottom: '1px solid #e2e8f0',
    color: '#4a5568',
  },
  list: {
    marginBottom: '24px',
    paddingLeft: '24px',
    color: '#4a5568',
    lineHeight: '1.8',
  },
  faqItem: {
    marginBottom: '32px',
  },
  faqQuestion: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '8px',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 98,
  },
}

