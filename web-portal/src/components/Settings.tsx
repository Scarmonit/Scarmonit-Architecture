import { useState } from 'react';
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Key,
  Save,
  RefreshCw,
  Moon,
  Sun,
  Monitor,
  Mail,
  Smartphone,
  Lock,
  Eye,
  EyeOff,
  Check
} from 'lucide-react';

interface SettingSection {
  id: string;
  label: string;
  icon: React.ReactNode;
}

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile');
  const [showApiKey, setShowApiKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const [settings, setSettings] = useState({
    // Profile
    displayName: 'Scarmonit User',
    email: 'user@scarmonit.com',
    timezone: 'UTC-5 (Eastern)',
    
    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    agentAlerts: true,
    weeklyDigest: false,
    
    // Appearance
    theme: 'dark',
    compactMode: false,
    animations: true,
    
    // Security
    twoFactor: false,
    sessionTimeout: '30',
    
    // API
    apiKey: 'sk-scarmonit-xxxxx-xxxxx-xxxxx',
  });

  const sections: SettingSection[] = [
    { id: 'profile', label: 'Profile', icon: <User size={20} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={20} /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={20} /> },
    { id: 'security', label: 'Security', icon: <Shield size={20} /> },
    { id: 'api', label: 'API Keys', icon: <Key size={20} /> },
  ];

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const renderSection = () => {
    switch(activeSection) {
      case 'profile':
        return (
          <div>
            <h3 className="text-lg font-semibold mb-4">Profile Settings</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm text-secondary mb-2 block">Display Name</label>
                <input
                  type="text"
                  className="input"
                  value={settings.displayName}
                  onChange={(e) => setSettings({ ...settings, displayName: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-secondary mb-2 block">Email Address</label>
                <input
                  type="email"
                  className="input"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-secondary mb-2 block">Timezone</label>
                <select 
                  className="input"
                  value={settings.timezone}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                >
                  <option>UTC-5 (Eastern)</option>
                  <option>UTC-8 (Pacific)</option>
                  <option>UTC+0 (GMT)</option>
                  <option>UTC+1 (CET)</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div>
            <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
            <div className="flex flex-col gap-4">
              {[
                { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive updates via email', icon: <Mail size={18} /> },
                { key: 'pushNotifications', label: 'Push Notifications', desc: 'Browser push notifications', icon: <Smartphone size={18} /> },
                { key: 'agentAlerts', label: 'Agent Alerts', desc: 'Get notified when agents complete tasks', icon: <Bell size={18} /> },
                { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Summary of weekly activity', icon: <Globe size={18} /> },
              ].map(item => (
                <div key={item.key} className="card flex justify-between items-center" style={{ padding: '16px' }}>
                  <div className="flex items-center gap-3">
                    <div style={{ color: 'var(--color-primary)' }}>{item.icon}</div>
                    <div>
                      <div className="font-medium">{item.label}</div>
                      <div className="text-sm text-muted">{item.desc}</div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={settings[item.key as keyof typeof settings] as boolean}
                      onChange={(e) => setSettings({ ...settings, [item.key]: e.target.checked })}
                    />
                    <div style={{
                      width: '44px',
                      height: '24px',
                      background: settings[item.key as keyof typeof settings] ? 'var(--color-primary)' : 'var(--bg-tertiary)',
                      borderRadius: '12px',
                      position: 'relative',
                      transition: 'background 0.2s'
                    }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        background: 'white',
                        borderRadius: '50%',
                        position: 'absolute',
                        top: '2px',
                        left: settings[item.key as keyof typeof settings] ? '22px' : '2px',
                        transition: 'left 0.2s'
                      }} />
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div>
            <h3 className="text-lg font-semibold mb-4">Appearance</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm text-secondary mb-3 block">Theme</label>
                <div className="flex gap-3">
                  {[
                    { value: 'light', label: 'Light', icon: <Sun size={20} /> },
                    { value: 'dark', label: 'Dark', icon: <Moon size={20} /> },
                    { value: 'system', label: 'System', icon: <Monitor size={20} /> },
                  ].map(theme => (
                    <button
                      key={theme.value}
                      className={`card card-interactive flex items-center gap-2 ${settings.theme === theme.value ? 'border-color: var(--color-primary)' : ''}`}
                      style={{ 
                        padding: '12px 20px',
                        borderColor: settings.theme === theme.value ? 'var(--color-primary)' : undefined,
                        background: settings.theme === theme.value ? 'rgba(99, 102, 241, 0.1)' : undefined
                      }}
                      onClick={() => setSettings({ ...settings, theme: theme.value })}
                    >
                      {theme.icon}
                      <span>{theme.label}</span>
                      {settings.theme === theme.value && <Check size={16} style={{ color: 'var(--color-success)' }} />}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="card flex justify-between items-center" style={{ padding: '16px' }}>
                <div>
                  <div className="font-medium">Compact Mode</div>
                  <div className="text-sm text-muted">Reduce spacing for more content</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={settings.compactMode}
                    onChange={(e) => setSettings({ ...settings, compactMode: e.target.checked })}
                  />
                  <div style={{
                    width: '44px',
                    height: '24px',
                    background: settings.compactMode ? 'var(--color-primary)' : 'var(--bg-tertiary)',
                    borderRadius: '12px',
                    position: 'relative',
                    transition: 'background 0.2s'
                  }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      background: 'white',
                      borderRadius: '50%',
                      position: 'absolute',
                      top: '2px',
                      left: settings.compactMode ? '22px' : '2px',
                      transition: 'left 0.2s'
                    }} />
                  </div>
                </label>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div>
            <h3 className="text-lg font-semibold mb-4">Security Settings</h3>
            <div className="flex flex-col gap-4">
              <div className="card" style={{ padding: '16px' }}>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3">
                    <Lock size={20} style={{ color: 'var(--color-primary)' }} />
                    <div>
                      <div className="font-medium">Two-Factor Authentication</div>
                      <div className="text-sm text-muted">Add an extra layer of security</div>
                    </div>
                  </div>
                  <span className={`status-badge ${settings.twoFactor ? 'status-online' : 'status-offline'}`}>
                    {settings.twoFactor ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <button className="btn btn-outline btn-sm">
                  {settings.twoFactor ? 'Disable 2FA' : 'Enable 2FA'}
                </button>
              </div>

              <div>
                <label className="text-sm text-secondary mb-2 block">Session Timeout (minutes)</label>
                <select 
                  className="input"
                  value={settings.sessionTimeout}
                  onChange={(e) => setSettings({ ...settings, sessionTimeout: e.target.value })}
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="120">2 hours</option>
                </select>
              </div>

              <button className="btn btn-outline" style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}>
                Sign Out All Devices
              </button>
            </div>
          </div>
        );

      case 'api':
        return (
          <div>
            <h3 className="text-lg font-semibold mb-4">API Keys</h3>
            <div className="card mb-4" style={{ padding: '16px' }}>
              <label className="text-sm text-secondary mb-2 block">Your API Key</label>
              <div className="flex gap-2">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  className="input font-mono"
                  value={settings.apiKey}
                  readOnly
                />
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-muted mt-2">Keep this key secret. Do not share it publicly.</p>
            </div>
            
            <div className="flex gap-3">
              <button className="btn btn-secondary">
                <RefreshCw size={16} />
                Regenerate Key
              </button>
              <button className="btn btn-outline">
                View API Docs
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-4 gap-6">
      {/* Sidebar */}
      <div className="card" style={{ padding: '8px' }}>
        <nav className="flex flex-col gap-1">
          {sections.map(section => (
            <button
              key={section.id}
              className={`nav-item ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              {section.icon}
              <span>{section.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="card" style={{ gridColumn: 'span 3' }}>
        {renderSection()}
        
        <div className="flex justify-end gap-3 mt-6 pt-6" style={{ borderTop: '1px solid var(--border-glass)' }}>
          <button className="btn btn-secondary">Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>
            {saved ? (
              <>
                <Check size={16} />
                Saved!
              </>
            ) : (
              <>
                <Save size={16} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
