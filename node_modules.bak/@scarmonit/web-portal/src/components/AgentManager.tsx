import { useState } from 'react';

export function AgentManager() {
  const [agents] = useState([
    { id: 'A-001', name: 'Research Agent', status: 'Active', type: 'Analysis', task: 'Analyzing logs...' },
    { id: 'A-002', name: 'Coding Agent', status: 'Idle', type: 'Development', task: '-' },
    { id: 'A-003', name: 'Security Agent', status: 'Active', type: 'Security', task: 'Scanning artifacts' },
  ]);

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold mb-6">Neural Agent Swarm</h2>
      
      <div className="grid-dashboard">
        {agents.map(agent => (
          <div key={agent.id} className="card">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-dim font-mono">{agent.id}</span>
              <span className={`badge ${agent.status === 'Active' ? 'online' : 'loading'}`}>{agent.status}</span>
            </div>
            <h3 className="text-xl font-bold mb-1">{agent.name}</h3>
            <p className="text-primary text-sm mb-4">{agent.type}</p>
            
            <div className="bg-black/20 p-3 rounded-md font-mono text-sm border border-glass">
              &gt; {agent.task}
            </div>
            
            <div className="mt-4 flex gap-2">
              <button className="btn text-sm py-1">Logs</button>
              <button className="btn text-sm py-1">Config</button>
            </div>
          </div>
        ))}
        
        <div className="card flex flex-col items-center justify-center border-dashed border-2 border-primary/30 hover:border-primary cursor-pointer group">
          <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">+</span>
          <span className="font-bold">Deploy New Agent</span>
        </div>
      </div>
    </div>
  );
}
