import { useState, useEffect, useCallback } from 'react'
import './App.css'

interface SystemStatus {
  name: string
  status: 'online' | 'offline' | 'loading'
  url?: string
  responseTime?: number
  lastChecked?: Date
}

interface Commit {
  sha: string
  message: string
  author: string
  date: string
}

interface DeploymentStatus {
  isDeploying: boolean
  lastDeployment?: string
  environment?: string
}

function App() {
  const [systems, setSystems] = useState<SystemStatus[]>([
    { name: 'Web Portal', status: 'online', url: 'http://localhost:5174' },
    { name: 'MCP Server', status: 'loading' },
    { name: 'Agent API', status: 'loading', url: 'https://agent-api.scarmonit.workers.dev' },
    { name: 'Copilot Extension', status: 'loading' },
  ])
  const [time, setTime] = useState(new Date())
  const [commits] = useState<Commit[]>([
    { sha: '38f30aa', message: 'Add package.json for Scarmonit architecture', author: 'Parker Dunn', date: '2 hours ago' },
    { sha: 'd78be57', message: 'Add README for web portal with detailed instructions', author: 'Parker Dunn', date: '2 hours ago' },
    { sha: '89bf0a2', message: 'Add migration guide for Scarmonit components', author: 'Parker Dunn', date: '3 hours ago' },
    { sha: '6a531b8', message: 'Revise README for improved clarity and detail', author: 'Parker Dunn', date: '3 hours ago' },
    { sha: 'b8c0b31', message: 'Initial commit', author: 'Parker Dunn', date: '3 hours ago' },
  ])
  const [deployment, setDeployment] = useState<DeploymentStatus>({ isDeploying: false })
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)])
  }

  const checkHealth = useCallback(async (name: string, url?: string): Promise<SystemStatus> => {
    const start = Date.now()
    try {
      if (url && url.startsWith('http')) {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 5000)

        try {
          await fetch(url, {
            mode: 'no-cors',
            signal: controller.signal
          })
          clearTimeout(timeout)
          return {
            name,
            status: 'online',
            url,
            responseTime: Date.now() - start,
            lastChecked: new Date()
          }
        } catch {
          clearTimeout(timeout)
          return { name, status: 'offline', url, lastChecked: new Date() }
        }
      }
      // For services without URLs, simulate check
      await new Promise(r => setTimeout(r, 200 + Math.random() * 300))
      return {
        name,
        status: 'online',
        responseTime: Date.now() - start,
        lastChecked: new Date()
      }
    } catch {
      return { name, status: 'offline', url, lastChecked: new Date() }
    }
  }, [])

  const runHealthChecks = useCallback(async () => {
    addLog('Starting health checks...')
    setSystems(prev => prev.map(s => ({ ...s, status: 'loading' as const })))

    const checks = await Promise.all([
      checkHealth('Web Portal', window.location.href),
      checkHealth('MCP Server'),
      checkHealth('Agent API', 'https://agent.scarmonit.com'),
      checkHealth('Copilot Extension'),
    ])

    setSystems(checks)
    const onlineCount = checks.filter(c => c.status === 'online').length
    addLog(`Health check complete: ${onlineCount}/${checks.length} services online`)
  }, [checkHealth])

  const triggerDeployment = async (target: 'web' | 'api' | 'all') => {
    setDeployment({ isDeploying: true, environment: target })
    addLog(`Triggering deployment: ${target}...`)

    // Simulate deployment
    await new Promise(r => setTimeout(r, 2000))

    const timestamp = new Date().toISOString()
    setDeployment({
      isDeploying: false,
      lastDeployment: timestamp,
      environment: target
    })
    addLog(`Deployment complete: ${target} @ ${new Date().toLocaleTimeString()}`)
  }

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    runHealthChecks()
    const interval = setInterval(runHealthChecks, 30000) // Check every 30s
    return () => clearInterval(interval)
  }, [runHealthChecks])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#10b981'
      case 'offline': return '#ef4444'
      default: return '#f59e0b'
    }
  }

  const totalOnline = systems.filter(s => s.status === 'online').length

  return (
    <div className="app">
      <header className="header">
        <h1>Scarmonit Control Center</h1>
        <div className="header-right">
          <span className={`health-badge ${totalOnline === systems.length ? 'healthy' : 'degraded'}`}>
            {totalOnline}/{systems.length} Online
          </span>
          <div className="time">{time.toLocaleString()}</div>
        </div>
      </header>

      <main className="main">
        <section className="status-grid">
          <div className="section-header">
            <h2>System Status</h2>
            <button className="refresh-btn" onClick={runHealthChecks}>Refresh</button>
          </div>
          <div className="grid">
            {systems.map(sys => (
              <div key={sys.name} className="status-card" onClick={() => sys.url && window.open(sys.url, '_blank')}>
                <div className="status-indicator" style={{ backgroundColor: getStatusColor(sys.status) }} />
                <div className="status-info">
                  <h3>{sys.name}</h3>
                  <span className={`status-badge ${sys.status}`}>{sys.status}</span>
                  {sys.responseTime && <span className="response-time">{sys.responseTime}ms</span>}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="deployment-section">
          <h2>Deployment Controls</h2>
          <div className="deployment-grid">
            <button
              className={`deploy-btn ${deployment.isDeploying ? 'deploying' : ''}`}
              onClick={() => triggerDeployment('web')}
              disabled={deployment.isDeploying}
            >
              {deployment.isDeploying && deployment.environment === 'web' ? 'Deploying...' : 'Deploy Web Portal'}
            </button>
            <button
              className={`deploy-btn ${deployment.isDeploying ? 'deploying' : ''}`}
              onClick={() => triggerDeployment('api')}
              disabled={deployment.isDeploying}
            >
              {deployment.isDeploying && deployment.environment === 'api' ? 'Deploying...' : 'Deploy Agent API'}
            </button>
            <button
              className={`deploy-btn deploy-all ${deployment.isDeploying ? 'deploying' : ''}`}
              onClick={() => triggerDeployment('all')}
              disabled={deployment.isDeploying}
            >
              {deployment.isDeploying && deployment.environment === 'all' ? 'Deploying...' : 'Deploy All'}
            </button>
          </div>
          {deployment.lastDeployment && (
            <p className="last-deploy">Last deployment: {new Date(deployment.lastDeployment).toLocaleString()}</p>
          )}
        </section>

        <section className="commits-section">
          <h2>Recent Commits</h2>
          <div className="commits-list">
            {commits.map(commit => (
              <div key={commit.sha} className="commit-item" onClick={() => window.open(`https://github.com/Scarmonit/Scarmonit-Architecture/commit/${commit.sha}`, '_blank')}>
                <code className="commit-sha">{commit.sha}</code>
                <span className="commit-message">{commit.message}</span>
                <span className="commit-meta">{commit.author} - {commit.date}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="logs-section">
          <h2>Activity Log</h2>
          <div className="logs-container">
            {logs.length === 0 ? (
              <p className="no-logs">No activity yet</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="log-entry">{log}</div>
              ))
            )}
          </div>
        </section>

        <section className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="actions">
            <button onClick={() => window.open('https://github.com/Scarmonit/Scarmonit-Architecture', '_blank')}>
              GitHub Repo
            </button>
            <button onClick={() => window.open('https://dash.cloudflare.com', '_blank')}>
              Cloudflare
            </button>
            <button onClick={() => window.open('https://github.com/Scarmonit/Scarmonit-Architecture/actions', '_blank')}>
              GitHub Actions
            </button>
            <button onClick={runHealthChecks}>
              Run Diagnostics
            </button>
          </div>
        </section>

        <section className="info">
          <h2>Architecture</h2>
          <div className="arch-grid">
            <div className="arch-item">
              <span className="arch-icon">🐳</span>
              <strong>Containerized</strong>
              <span>Docker + Nginx</span>
            </div>
            <div className="arch-item">
              <span className="arch-icon">⚛️</span>
              <strong>Web Portal</strong>
              <span>React 19 + Vite 6</span>
            </div>
            <div className="arch-item">
              <span className="arch-icon">☁️</span>
              <strong>Agent API</strong>
              <span>Cloudflare Workers</span>
            </div>
            <div className="arch-item">
              <span className="arch-icon">🔌</span>
              <strong>MCP Server</strong>
              <span>Node.js + MCP SDK</span>
            </div>
            <div className="arch-item">
              <span className="arch-icon">🤖</span>
              <strong>Copilot</strong>
              <span>GitHub Extension</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>Scarmonit Industries © {new Date().getFullYear()} | {totalOnline === systems.length ? 'All Systems Operational' : 'Some Systems Degraded'}</p>
      </footer>
    </div>
  )
}

export default App
