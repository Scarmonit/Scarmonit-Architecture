import { useState, useEffect } from 'react';
import { checkDockerContainers, checkKubernetesPods, diagnoseAgents } from '../services/mcpRouter';

export function Dashboard() {
  const [systems, setSystems] = useState([
    { name: 'Web Portal', status: 'online', latency: '12ms' },
    { name: 'Agent API', status: 'online', latency: '45ms' },
    { name: 'MCP Server', status: 'online', latency: '20ms' },
    { name: 'Docker Swarm', status: 'loading', latency: '-' },
    { name: 'Kubernetes', status: 'loading', latency: '-' },
  ]);

  useEffect(() => {
    // Simulate live data
    const timer = setInterval(() => {
      setSystems(prev => prev.map(s => ({
        ...s,
        latency: s.status === 'online' ? Math.floor(Math.random() * 50 + 10) + 'ms' : '-'
      })));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold mb-6">System Overview</h2>
      
      <div className="grid-dashboard">
        {systems.map((sys, idx) => (
          <div key={idx} className="card">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">{sys.name}</h3>
              <span className={`badge ${sys.status}`}>{sys.status}</span>
            </div>
            <div className="text-dim">Latency</div>
            <div className="text-2xl font-mono">{sys.latency}</div>
            <div className="mt-4 h-1 w-full bg-glass rounded overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500" 
                style={{ width: sys.status === 'online' ? '100%' : '0%', backgroundColor: sys.status === 'online' ? 'var(--color-success)' : 'transparent' }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="grid-dashboard mt-8">
        <div className="card">
          <h3>Quick Actions</h3>
          <div className="flex gap-4 mt-4">
            <button className="btn" onClick={() => checkDockerContainers()}>Check Docker</button>
            <button className="btn" onClick={() => diagnoseAgents()}>Diagnose Agents</button>
          </div>
        </div>
        <div className="card">
          <h3>Deployment</h3>
          <p className="text-dim mb-4">Last deployed: Just now</p>
          <button className="btn btn-primary">Deploy Production</button>
        </div>
      </div>
    </div>
  );
}
