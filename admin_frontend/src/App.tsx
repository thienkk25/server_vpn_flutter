import { useState, useEffect } from 'react';
import { useAdminStore } from './presentation/hooks/useAdminStore';
import ServersPage from './presentation/pages/ServersPage';
import UsersPage from './presentation/pages/UsersPage';
import SettingsPage from './presentation/pages/SettingsPage';
import { LayoutDashboard, Users, Settings, KeyRound } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState<'servers' | 'users' | 'settings'>('servers');
  const { apiKey, setApiKey } = useAdminStore();
  const [tempKey, setTempKey] = useState(apiKey);

  useEffect(() => {
    const handler = setTimeout(() => {
      setApiKey(tempKey);
    }, 1000);
    return () => clearTimeout(handler);
  }, [tempKey, setApiKey]);

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar glass-panel">
        <div className="logo">
          <span className="logo-icon">🚀</span>
          <h1>VPN Admin</h1>
        </div>
        
        <nav className="nav-menu">
          <a href="#" className={`nav-item ${activeTab === 'servers' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('servers'); }}>
            <LayoutDashboard size={20} />
            Servers
          </a>
          <a href="#" className={`nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('users'); }}>
            <Users size={20} />
            Users
          </a>
          <a href="#" className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('settings'); }}>
            <Settings size={20} />
            Settings
          </a>
        </nav>

        <div className="api-key-section">
          <label htmlFor="apiKey" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <KeyRound size={16} /> API Key (Dev)
          </label>
          <input 
            type="password" 
            id="apiKey" 
            placeholder="Enter API Key" 
            className="glass-input" 
            value={tempKey}
            onChange={(e) => setTempKey(e.target.value)}
          />
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
          {activeTab === 'servers' && <ServersPage />}
          {activeTab === 'users' && <UsersPage />}
          {activeTab === 'settings' && <SettingsPage />}
        </div>
      </main>
    </div>
  );
}

export default App;
