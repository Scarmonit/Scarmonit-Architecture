import { useState, useCallback } from 'react';
import {
  Bot,
  Play,
  Pause,
  Settings,
  Terminal,
  Plus,
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Loader2
} from 'lucide-react';

// API configuration - uses environment variable or falls back to production URL
const API_URL = import.meta.env.VITE_API_URL || 'https://agent-api.scarmonit.workers.dev';

// API response types
interface TaskSubmitResponse {
  success: boolean;
  taskId: string;
  message: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

interface ApiError {
  error: string;
  details?: string;
}

interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'idle' | 'error' | 'paused' | 'starting';
  task: string;
  completedTasks: number;
  uptime: string;
  cpu: number;
  memory: number;
  taskId?: string; // Backend task ID when running
}

export function AgentManager() {
  const [agents, setAgents] = useState<Agent[]>([
    { id: 'A-001', name: 'Research Agent', type: 'Analysis', status: 'active', task: 'Analyzing market trends...', completedTasks: 156, uptime: '24h 32m', cpu: 45, memory: 62 },
    { id: 'A-002', name: 'Coding Agent', type: 'Development', status: 'idle', task: 'Waiting for tasks', completedTasks: 89, uptime: '12h 15m', cpu: 5, memory: 28 },
    { id: 'A-003', name: 'Security Agent', type: 'Security', status: 'active', task: 'Scanning artifacts for vulnerabilities', completedTasks: 234, uptime: '48h 10m', cpu: 72, memory: 55 },
    { id: 'A-004', name: 'Writer Agent', type: 'Content', status: 'paused', task: 'Paused by user', completedTasks: 67, uptime: '8h 45m', cpu: 0, memory: 15 },
    { id: 'A-005', name: 'Monitor Agent', type: 'Monitoring', status: 'active', task: 'Tracking system metrics', completedTasks: 1024, uptime: '72h 0m', cpu: 28, memory: 42 },
    { id: 'A-006', name: 'QA Agent', type: 'Testing', status: 'error', task: 'Error: Connection timeout', completedTasks: 45, uptime: '2h 30m', cpu: 0, memory: 35 },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'status-online';
      case 'idle': return 'status-idle';
      case 'paused': return 'status-loading';
      case 'starting': return 'status-loading';
      case 'error': return 'status-offline';
      default: return 'status-idle';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'active': return <Zap size={14} />;
      case 'idle': return <Clock size={14} />;
      case 'paused': return <Pause size={14} />;
      case 'starting': return <Loader2 size={14} className="animate-spin" />;
      case 'error': return <AlertTriangle size={14} />;
      default: return <Clock size={14} />;
    }
  };

  // Submit task to backend API and start agent
  const startAgent = useCallback(async (agent: Agent): Promise<void> => {
    // Set agent to starting state
    setAgents(prev => prev.map(a =>
      a.id === agent.id
        ? { ...a, status: 'starting' as const, task: 'Connecting to backend...', cpu: 10 }
        : a
    ));

    try {
      const response = await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: `Execute ${agent.type.toLowerCase()} task for ${agent.name}`,
          agentType: agent.type,
          agentId: agent.id,
          domain: 'general'
        })
      });

      if (!response.ok) {
        const errorData = await response.json() as ApiError;
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json() as TaskSubmitResponse;

      if (data.success) {
        // Agent started successfully
        setAgents(prev => prev.map(a =>
          a.id === agent.id
            ? {
                ...a,
                status: 'active' as const,
                task: `Running: ${data.taskId}`,
                taskId: data.taskId,
                cpu: 45
              }
            : a
        ));
        console.log(`Agent ${agent.name} started with task ID: ${data.taskId}`);
      } else {
        throw new Error(data.message || 'Failed to start agent');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to start agent ${agent.name}:`, errorMessage);

      // Set agent to error state
      setAgents(prev => prev.map(a =>
        a.id === agent.id
          ? { ...a, status: 'error' as const, task: `Error: ${errorMessage}`, cpu: 0 }
          : a
      ));
    }
  }, []);

  // Pause agent (local state only - backend doesn't have pause endpoint yet)
  const pauseAgent = useCallback((agent: Agent): void => {
    setAgents(prev => prev.map(a =>
      a.id === agent.id
        ? { ...a, status: 'paused' as const, task: 'Paused by user', cpu: 0 }
        : a
    ));
  }, []);

  // Toggle agent state - calls backend API for start, local for pause
  const toggleAgent = useCallback(async (id: string): Promise<void> => {
    const agent = agents.find(a => a.id === id);
    if (!agent) return;

    if (agent.status === 'active') {
      pauseAgent(agent);
    } else if (agent.status === 'paused' || agent.status === 'idle') {
      await startAgent(agent);
    }
  }, [agents, startAgent, pauseAgent]);

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          agent.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || agent.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const stats = [
    { label: 'Active', value: agents.filter(a => a.status === 'active').length, color: 'var(--color-success)' },
    { label: 'Starting', value: agents.filter(a => a.status === 'starting').length, color: 'var(--color-primary)' },
    { label: 'Idle', value: agents.filter(a => a.status === 'idle').length, color: 'var(--text-muted)' },
    { label: 'Paused', value: agents.filter(a => a.status === 'paused').length, color: 'var(--color-warning)' },
    { label: 'Error', value: agents.filter(a => a.status === 'error').length, color: 'var(--color-danger)' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">AI Agent Swarm</h2>
          <p className="text-secondary mt-1">Manage and monitor your autonomous agents</p>
        </div>
        <button className="btn btn-primary btn-lg">
          <Plus size={18} />
          Deploy Agent
        </button>
      </div>

      {/* Stats Bar */}
      <div className="card mb-6" style={{ padding: '16px' }}>
        <div className="flex justify-between items-center">
          <div className="flex gap-6">
            {stats.map((stat, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div style={{ 
                  width: '10px', 
                  height: '10px', 
                  borderRadius: '50%', 
                  background: stat.color 
                }} />
                <span className="text-sm text-secondary">{stat.label}:</span>
                <span className="font-semibold">{stat.value}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <div className="search-container">
              <Search className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '200px' }}
              />
            </div>
            <select
              className="input"
              style={{ width: 'auto' }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="starting">Starting</option>
              <option value="idle">Idle</option>
              <option value="paused">Paused</option>
              <option value="error">Error</option>
            </select>
          </div>
        </div>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-3 gap-4">
        {filteredAgents.map(agent => (
          <div key={agent.id} className="card card-interactive">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div style={{ 
                  padding: '10px', 
                  background: agent.status === 'error' ? 'var(--color-danger-bg)' : 'rgba(99, 102, 241, 0.1)', 
                  borderRadius: 'var(--radius-md)'
                }}>
                  <Bot size={24} style={{ color: agent.status === 'error' ? 'var(--color-danger)' : 'var(--color-primary)' }} />
                </div>
                <div>
                  <div className="font-semibold">{agent.name}</div>
                  <div className="text-xs text-muted font-mono">{agent.id}</div>
                </div>
              </div>
              <span className={`status-badge ${getStatusColor(agent.status)}`}>
                {getStatusIcon(agent.status)}
                {agent.status}
              </span>
            </div>

            <div className="text-sm text-accent mb-3">{agent.type}</div>

            <div className="code-block mb-3" style={{ padding: '10px', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>&gt;</span> {agent.task}
            </div>

            {/* Resource Usage */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted">CPU</span>
                  <span>{agent.cpu}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${agent.cpu}%`,
                      background: agent.cpu > 80 ? 'var(--color-danger)' : undefined
                    }} 
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted">Memory</span>
                  <span>{agent.memory}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${agent.memory}%`,
                      background: agent.memory > 80 ? 'var(--color-danger)' : undefined
                    }} 
                  />
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex justify-between text-sm text-secondary mb-4">
              <div className="flex items-center gap-1">
                <CheckCircle2 size={14} />
                {agent.completedTasks} tasks
              </div>
              <div className="flex items-center gap-1">
                <Clock size={14} />
                {agent.uptime}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                className={`btn ${agent.status === 'active' ? 'btn-secondary' : 'btn-primary'} flex-1`}
                onClick={() => toggleAgent(agent.id)}
                disabled={agent.status === 'error' || agent.status === 'starting'}
              >
                {agent.status === 'starting' ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : agent.status === 'active' ? (
                  <Pause size={16} />
                ) : (
                  <Play size={16} />
                )}
                {agent.status === 'starting' ? 'Starting...' : agent.status === 'active' ? 'Pause' : 'Start'}
              </button>
              <button className="btn btn-ghost">
                <Terminal size={16} />
              </button>
              <button className="btn btn-ghost">
                <Settings size={16} />
              </button>
            </div>
          </div>
        ))}

        {/* Add New Agent Card */}
        <div 
          className="card flex flex-col items-center justify-center cursor-pointer"
          style={{ 
            border: '2px dashed var(--border-glass)',
            minHeight: '300px'
          }}
        >
          <div style={{ 
            padding: '16px', 
            background: 'var(--bg-glass)', 
            borderRadius: 'var(--radius-lg)',
            marginBottom: '16px'
          }}>
            <Plus size={32} style={{ color: 'var(--color-primary)' }} />
          </div>
          <span className="font-semibold mb-1">Deploy New Agent</span>
          <span className="text-sm text-muted">Choose from templates</span>
        </div>
      </div>

      {filteredAgents.length === 0 && (
        <div className="empty-state">
          <Bot className="empty-state-icon" />
          <h3 className="empty-state-title">No agents found</h3>
          <p className="empty-state-text">Try adjusting your search or deploy a new agent.</p>
        </div>
      )}
    </div>
  );
}
