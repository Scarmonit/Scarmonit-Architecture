import { useState } from 'react';
import {
  FolderArchive,
  File,
  FileCode,
  FileText,
  Image as ImageIcon,
  Download,
  Trash2,
  Eye,
  Search,
  Filter,
  Plus,
  Calendar,
  HardDrive
} from 'lucide-react';

interface Artifact {
  id: string;
  name: string;
  type: 'code' | 'document' | 'image' | 'data';
  size: string;
  created: string;
  agent: string;
  status: 'ready' | 'processing' | 'archived';
}

export function Artifacts() {
  const [artifacts] = useState<Artifact[]>([
    { id: '1', name: 'analysis_report_q4.json', type: 'data', size: '2.4 MB', created: '2 hours ago', agent: 'Research Agent', status: 'ready' },
    { id: '2', name: 'security_scan_results.md', type: 'document', size: '156 KB', created: '5 hours ago', agent: 'Security Agent', status: 'ready' },
    { id: '3', name: 'generated_api_schema.ts', type: 'code', size: '89 KB', created: '1 day ago', agent: 'Coding Agent', status: 'ready' },
    { id: '4', name: 'architecture_diagram.png', type: 'image', size: '1.2 MB', created: '2 days ago', agent: 'Design Agent', status: 'ready' },
    { id: '5', name: 'performance_metrics.json', type: 'data', size: '567 KB', created: '3 days ago', agent: 'Monitor Agent', status: 'archived' },
    { id: '6', name: 'test_coverage_report.html', type: 'document', size: '234 KB', created: '4 days ago', agent: 'QA Agent', status: 'ready' },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  const getFileIcon = (type: string) => {
    switch(type) {
      case 'code': return <FileCode size={20} style={{ color: 'var(--color-accent)' }} />;
      case 'document': return <FileText size={20} style={{ color: 'var(--color-primary)' }} />;
      case 'image': return <ImageIcon size={20} style={{ color: 'var(--color-success)' }} />;
      case 'data': return <File size={20} style={{ color: 'var(--color-warning)' }} />;
      default: return <File size={20} />;
    }
  };

  const filteredArtifacts = artifacts.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.agent.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || a.type === selectedType;
    return matchesSearch && matchesType;
  });

  const stats = [
    { label: 'Total Artifacts', value: artifacts.length.toString(), icon: <FolderArchive size={20} /> },
    { label: 'Storage Used', value: '4.6 GB', icon: <HardDrive size={20} /> },
    { label: 'This Week', value: '24', icon: <Calendar size={20} /> },
  ];

  return (
    <div>
      {/* Header Stats */}
      <div className="grid grid-cols-3 mb-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="card">
            <div className="flex items-center gap-3">
              <div style={{ 
                padding: '10px', 
                background: 'var(--bg-glass)', 
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-primary)'
              }}>
                {stat.icon}
              </div>
              <div>
                <div className="stat-value text-xl">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="card mb-6">
        <div className="flex justify-between items-center">
          <div className="flex gap-3 items-center flex-1">
            <div className="search-container" style={{ flex: 1, maxWidth: '400px' }}>
              <Search className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search artifacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
            
            <div className="flex gap-2">
              {['all', 'code', 'document', 'image', 'data'].map(type => (
                <button
                  key={type}
                  className={`btn ${selectedType === type ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                  onClick={() => setSelectedType(type)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <button className="btn btn-primary">
            <Plus size={18} />
            Upload
          </button>
        </div>
      </div>

      {/* Artifacts Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">All Artifacts</h3>
            <p className="card-subtitle">{filteredArtifacts.length} items</p>
          </div>
          <button className="btn btn-ghost btn-sm">
            <Filter size={14} />
            Sort
          </button>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Size</th>
                <th>Created</th>
                <th>Agent</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredArtifacts.map(artifact => (
                <tr key={artifact.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      {getFileIcon(artifact.type)}
                      <span className="font-medium">{artifact.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="text-sm text-secondary capitalize">{artifact.type}</span>
                  </td>
                  <td>
                    <span className="font-mono text-sm">{artifact.size}</span>
                  </td>
                  <td>
                    <span className="text-sm text-secondary">{artifact.created}</span>
                  </td>
                  <td>
                    <span className="text-sm">{artifact.agent}</span>
                  </td>
                  <td>
                    <span className={`status-badge ${artifact.status === 'ready' ? 'status-online' : artifact.status === 'processing' ? 'status-loading' : 'status-idle'}`}>
                      {artifact.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn btn-ghost btn-sm" title="Preview">
                        <Eye size={16} />
                      </button>
                      <button className="btn btn-ghost btn-sm" title="Download">
                        <Download size={16} />
                      </button>
                      <button className="btn btn-ghost btn-sm" title="Delete" style={{ color: 'var(--color-danger)' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredArtifacts.length === 0 && (
          <div className="empty-state">
            <FolderArchive className="empty-state-icon" />
            <h3 className="empty-state-title">No artifacts found</h3>
            <p className="empty-state-text">Try adjusting your search or filters to find what you're looking for.</p>
          </div>
        )}
      </div>
    </div>
  );
}
