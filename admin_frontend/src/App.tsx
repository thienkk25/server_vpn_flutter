import { useState } from 'react';
import { useAdminStore } from './presentation/hooks/useAdminStore';
import ServersPage from './presentation/pages/ServersPage';
import UsersPage from './presentation/pages/UsersPage';
import SettingsPage from './presentation/pages/SettingsPage';
import { LayoutDashboard, Users, Settings, KeyRound } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState<'servers' | 'users' | 'settings'>('servers');
  const [mountedTabs, setMountedTabs] = useState({ servers: true, users: false, settings: false });
  const { apiKey, setApiKey } = useAdminStore();
  const [tempKey, setTempKey] = useState(apiKey);

  const handleTabChange = (tab: 'servers' | 'users' | 'settings') => {
    setActiveTab(tab);
    if (!mountedTabs[tab]) {
      setMountedTabs(prev => ({ ...prev, [tab]: true }));
    }
  };

  const handleSaveKey = () => {
    setApiKey(tempKey);
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar glass-panel">
        <div className="logo">
          <span className="logo-icon">🚀</span>
          <h1>VPN Admin</h1>
        </div>
        
        <nav className="nav-menu">
          <a href="#" className={`nav-item ${activeTab === 'servers' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleTabChange('servers'); }}>
            <LayoutDashboard size={20} />
            Servers
          </a>
          <a href="#" className={`nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleTabChange('users'); }}>
            <Users size={20} />
            Users
          </a>
          <a href="#" className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleTabChange('settings'); }}>
            <Settings size={20} />
            Settings
          </a>
        </nav>

        <div className="api-key-section">
          <label htmlFor="apiKey" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <KeyRound size={16} /> API Key (Dev)
          </label>
          <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
            <input 
              type="password" 
              id="apiKey" 
              placeholder="Enter API Key" 
              className="glass-input" 
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveKey()}
              style={{ width: '100%' }}
            />
            <button 
              className="primary-btn glow-effect" 
              onClick={handleSaveKey}
              disabled={tempKey === apiKey}
              style={{ padding: '0 12px', fontSize: '0.85em', opacity: tempKey === apiKey ? 0.5 : 1 }}
            >
              Save
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="top-header">
          <div className="header-info">
            <h2>
              {activeTab === 'servers' && 'Server Management'}
              {activeTab === 'users' && 'User Management'}
              {activeTab === 'settings' && 'App Settings'}
            </h2>
            <p className="subtitle">
              {activeTab === 'servers' && 'Monitor and configure your VPN network nodes'}
              {activeTab === 'users' && 'Monitor user accounts and subscriptions'}
              {activeTab === 'settings' && 'Configure global application behavior'}
            </p>
          </div>
        </header>

        <div className="content-body">
          {mountedTabs.servers && (
            <div style={{ display: activeTab === 'servers' ? 'block' : 'none', height: '100%' }}>
              <ServersPage />
            </div>
          )}
          {mountedTabs.users && (
            <div style={{ display: activeTab === 'users' ? 'block' : 'none', height: '100%' }}>
              <UsersPage />
            </div>
          )}
          {mountedTabs.settings && (
            <div style={{ display: activeTab === 'settings' ? 'block' : 'none', height: '100%' }}>
              <SettingsPage />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
