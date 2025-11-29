import { useState } from 'react';
import './index.css';
import { 
  LayoutDashboard, 
  Bot, 
  FolderArchive, 
  MessageSquare, 
  Settings,
  Search,
  Bell,
  Menu,
  X,
  ChevronRight,
  Zap,
  HelpCircle
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { AgentManager } from './components/AgentManager';
import { Artifacts } from './components/Artifacts';
import { Feedback } from './components/Feedback';
import { SettingsPage } from './components/Settings';

type Page = 'dashboard' | 'agents' | 'artifacts' | 'feedback' | 'settings';

interface NavItem {
  id: Page;
  label: string;
  icon: React.ReactNode;
}

function App() {
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const mainNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="nav-icon" /> },
    { id: 'agents', label: 'AI Agents', icon: <Bot className="nav-icon" /> },
    { id: 'artifacts', label: 'Artifacts', icon: <FolderArchive className="nav-icon" /> },
  ];

  const supportNavItems: NavItem[] = [
    { id: 'feedback', label: 'Feedback', icon: <MessageSquare className="nav-icon" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="nav-icon" /> },
  ];

  const getPageTitle = () => {
    const titles: Record<Page, string> = {
      dashboard: 'Mission Control',
      agents: 'AI Agents',
      artifacts: 'Artifacts',
      feedback: 'Feedback',
      settings: 'Settings'
    };
    return titles[activePage];
  };

  const renderPage = () => {
    switch(activePage) {
      case 'dashboard': return <Dashboard />;
      case 'agents': return <AgentManager />;
      case 'artifacts': return <Artifacts />;
      case 'feedback': return <Feedback />;
      case 'settings': return <SettingsPage />;
      default: return <Dashboard />;
    }
  };

  const handleNavClick = (page: Page) => {
    setActivePage(page);
    setSidebarOpen(false);
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <a href="/" className="sidebar-logo">
            <div className="logo-icon">S</div>
            <span className="logo-text">Scarmonit</span>
          </a>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">Main Menu</div>
            {mainNavItems.map(item => (
              <button
                key={item.id}
                className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
              >
                {item.icon}
                <span>{item.label}</span>
                {activePage === item.id && <ChevronRight size={16} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
              </button>
            ))}
          </div>

          <div className="nav-section">
            <div className="nav-section-title">Support</div>
            {supportNavItems.map(item => (
              <button
                key={item.id}
                className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="card" style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Zap size={16} style={{ color: 'var(--color-primary)' }} />
              <span className="text-sm font-semibold">Pro Features</span>
            </div>
            <p className="text-xs text-muted mb-3">Unlock advanced AI capabilities and priority support.</p>
            <button className="btn btn-primary btn-sm w-full">Upgrade</button>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="main-wrapper">
        {/* Top Header */}
        <header className="top-header">
          <div className="header-left">
            <button 
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h1 className="page-title">{getPageTitle()}</h1>
          </div>

          <div className="search-container">
            <Search className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search agents, artifacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="header-right">
            <button className="header-btn" title="Help">
              <HelpCircle size={20} />
            </button>
            <button className="header-btn" title="Notifications">
              <Bell size={20} />
              <span className="notification-badge">3</span>
            </button>
            <div className="user-avatar" title="Profile">
              SC
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="main-content">
          <div className="page-enter">
            {renderPage()}
          </div>
        </main>

        {/* Footer */}
        <footer className="footer">
          <p>Scarmonit Architecture v2.5.0 • Powered by AI Infrastructure</p>
        </footer>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 40
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
