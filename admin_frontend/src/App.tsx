import { useState } from 'react';
import { useAdminStore } from './presentation/hooks/useAdminStore';
import ServersPage from './presentation/pages/ServersPage';
import UsersPage from './presentation/pages/UsersPage';
import SettingsPage from './presentation/pages/SettingsPage';
import { LayoutDashboard, Users, Settings, KeyRound, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function App() {
  const [activeTab, setActiveTab] = useState<'servers' | 'users' | 'settings'>('servers');
  const [mountedTabs, setMountedTabs] = useState({ servers: true, users: false, settings: false });
  const { apiKey, setApiKey } = useAdminStore();
  const [tempKey, setTempKey] = useState(apiKey);
  const { t, i18n } = useTranslation();

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
          <h1>{t('vpn_admin')}</h1>
        </div>
        
        <nav className="nav-menu">
          <a href="#" className={`nav-item ${activeTab === 'servers' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleTabChange('servers'); }}>
            <LayoutDashboard size={20} />
            {t('servers')}
          </a>
          <a href="#" className={`nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleTabChange('users'); }}>
            <Users size={20} />
            {t('users')}
          </a>
          <a href="#" className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleTabChange('settings'); }}>
            <Settings size={20} />
            {t('settings')}
          </a>
        </nav>

        <div className="api-key-section">
          <label htmlFor="apiKey" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <KeyRound size={16} /> {t('api_key_dev')}
          </label>
          <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
            <input 
              type="password" 
              id="apiKey" 
              placeholder={t('enter_api_key')} 
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
              {t('save')}
            </button>
          </div>
        </div>

        <div className="api-key-section" style={{ marginTop: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={16} /> {t('language')}
          </label>
          <div style={{ marginTop: '6px' }}>
            <select 
              className="glass-input" 
              style={{ width: '100%' }}
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
            >
              <option value="en" style={{ color: '#000' }}>{t('english')}</option>
              <option value="vi" style={{ color: '#000' }}>{t('vietnamese')}</option>
            </select>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="top-header">
          <div className="header-info">
            <h2>
              {activeTab === 'servers' && t('server_management')}
              {activeTab === 'users' && t('user_management')}
              {activeTab === 'settings' && t('app_settings')}
            </h2>
            <p className="subtitle">
              {activeTab === 'servers' && t('monitor_configure_servers')}
              {activeTab === 'users' && t('monitor_user_accounts')}
              {activeTab === 'settings' && t('configure_global_behavior')}
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
