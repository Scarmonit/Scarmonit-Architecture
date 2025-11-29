import { useState, useEffect } from 'react';
import { 
  Activity, 
  Server, 
  Cpu, 
  HardDrive, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  Play,
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap
} from 'lucide-react';

interface SystemStatus {
  name: string;
  status: 'online' | 'offline' | 'loading';
  latency: string;
  uptime: string;
  icon: React.ReactNode;
}

interface QuickStat {
  label: string;
  value: string;
  change: number;
  icon: React.ReactNode;
}

export function Dashboard() {
  const [systems, setSystems] = useState<SystemStatus[]>([
    { name: 'Web Portal', status: 'online', latency: '12ms', uptime: '99.9%', icon: <Server size={20} /> },
    { name: 'Agent API', status: 'online', latency: '45ms', uptime: '99.7%', icon: <Cpu size={20} /> },
    { name: 'MCP Server', status: 'online', latency: '20ms', uptime: '99.8%', icon: <Activity size={20} /> },
    { name: 'Docker Swarm', status: 'online', latency: '35ms', uptime: '99.5%', icon: <HardDrive size={20} /> },
  ]);

  const [stats] = useState<QuickStat[]>([
    { label: 'Active Agents', value: '12', change: 3, icon: <Zap size={20} /> },
    { label: 'Tasks Completed', value: '1,284', change: 12, icon: <CheckCircle2 size={20} /> },
    { label: 'Avg Response', value: '28ms', change: -5, icon: <Clock size={20} /> },
    { label: 'System Health', value: '98%', change: 2, icon: <Activity size={20} /> },
  ]);

  const [recentActivity] = useState([
    { id: 1, type: 'success', message: 'Research Agent completed analysis', time: '2 min ago' },
    { id: 2, type: 'info', message: 'New deployment initiated', time: '5 min ago' },
    { id: 3, type: 'success', message: 'Security scan completed', time: '12 min ago' },
    { id: 4, type: 'warning', message: 'High memory usage detected', time: '18 min ago' },
    { id: 5, type: 'success', message: 'Backup completed successfully', time: '25 min ago' },
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSystems(prev => prev.map(s => ({
        ...s,
        latency: s.status === 'online' ? Math.floor(Math.random() * 50 + 10) + 'ms' : '-'
      })));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const getStatusIcon = (type: string) => {
    switch(type) {
      case 'success': return <CheckCircle2 size={16} style={{ color: 'var(--color-success)' }} />;
      case 'warning': return <AlertCircle size={16} style={{ color: 'var(--color-warning)' }} />;
      case 'info': return <Activity size={16} style={{ color: 'var(--color-primary)' }} />;
      default: return <Activity size={16} />;
    }
  };

  return (
    <div>
      {/* Welcome Banner */}
      <div className="card mb-6" style={{ 
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(34, 211, 238, 0.1))',
        border: '1px solid rgba(99, 102, 241, 0.2)'
      }}>
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold mb-2">Welcome back!</h2>
            <p className="text-secondary">All systems operational. 12 agents are currently active.</p>
          </div>
          <button className="btn btn-primary btn-lg">
            <Play size={18} />
            Quick Deploy
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 mb-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="card">
            <div className="flex justify-between items-start mb-3">
              <div style={{ 
                padding: '10px', 
                background: 'var(--bg-glass)', 
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-primary)'
              }}>
                {stat.icon}
              </div>
              <div className={`stat-change ${stat.change >= 0 ? 'positive' : 'negative'}`}>
                {stat.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {Math.abs(stat.change)}%
              </div>
            </div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* System Status */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">System Status</h3>
              <p className="card-subtitle">Real-time infrastructure monitoring</p>
            </div>
            <button className="btn btn-ghost btn-sm">
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {systems.map((sys, idx) => (
              <div key={idx} className="card card-interactive" style={{ padding: '16px' }}>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3">
                    <div style={{ 
                      padding: '8px', 
                      background: 'var(--bg-glass)', 
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--color-accent)'
                    }}>
                      {sys.icon}
                    </div>
                    <div>
                      <div className="font-semibold">{sys.name}</div>
                      <div className="text-xs text-muted">Uptime: {sys.uptime}</div>
                    </div>
                  </div>
                  <span className={`status-badge status-${sys.status}`}>
                    <span className="status-dot pulse"></span>
                    {sys.status}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-secondary">Latency</span>
                  <span className="font-mono font-semibold">{sys.latency}</span>
                </div>
                <div className="progress-bar mt-2">
                  <div 
                    className="progress-fill" 
                    style={{ width: sys.status === 'online' ? '100%' : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Recent Activity</h3>
              <p className="card-subtitle">Latest system events</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            {recentActivity.map(activity => (
              <div key={activity.id} className="flex items-start gap-3 p-2" style={{ 
                background: 'var(--bg-glass)', 
                borderRadius: 'var(--radius-sm)' 
              }}>
                {getStatusIcon(activity.type)}
                <div className="flex-1">
                  <p className="text-sm">{activity.message}</p>
                  <p className="text-xs text-muted mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>

          <button className="btn btn-secondary w-full mt-4">
            View All Activity
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 mt-6">
        <div className="card card-interactive">
          <h3 className="card-title mb-2">Deploy Agent</h3>
          <p className="text-sm text-muted mb-4">Launch a new AI agent from templates</p>
          <button className="btn btn-outline">Get Started</button>
        </div>
        <div className="card card-interactive">
          <h3 className="card-title mb-2">Run Diagnostics</h3>
          <p className="text-sm text-muted mb-4">Check system health and performance</p>
          <button className="btn btn-outline">Run Check</button>
        </div>
        <div className="card card-interactive">
          <h3 className="card-title mb-2">View Logs</h3>
          <p className="text-sm text-muted mb-4">Access detailed system logs</p>
          <button className="btn btn-outline">Open Logs</button>
        </div>
      </div>
    </div>
  );
}
