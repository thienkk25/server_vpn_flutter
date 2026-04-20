import { useState } from 'react';
import { useAdminStore } from './presentation/hooks/useAdminStore';
import ServersPage from './presentation/pages/ServersPage';
import UsersPage from './presentation/pages/UsersPage';
import SettingsPage from './presentation/pages/SettingsPage';
import IapWebhooksPage from './presentation/pages/IapWebhooksPage';
import { RevenuePage } from './presentation/pages/RevenuePage';
import { LayoutDashboard, Users, Settings, KeyRound, BellRing, DollarSign, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function App() {
  const [activeTab, setActiveTab] = useState<'revenue' | 'servers' | 'users' | 'settings' | 'webhooks'>('revenue');
  const [mountedTabs, setMountedTabs] = useState({ revenue: true, servers: false, users: false, settings: false, webhooks: false });
  const { apiKey, setApiKey } = useAdminStore();
  const [tempKey, setTempKey] = useState(apiKey);
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'vi' : 'en';
    i18n.changeLanguage(newLang);
  };

  const handleTabChange = (tab: 'revenue' | 'servers' | 'users' | 'settings' | 'webhooks') => {
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
          <h1>{t('sidebar.title')}</h1>
        </div>
        
        <nav className="nav-menu">
          <a href="#" className={`nav-item ${activeTab === 'revenue' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleTabChange('revenue'); }}>
            <DollarSign size={20} />
            {t('sidebar.revenue')}
          </a>
          <a href="#" className={`nav-item ${activeTab === 'servers' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleTabChange('servers'); }}>
            <LayoutDashboard size={20} />
            {t('sidebar.servers')}
          </a>
          <a href="#" className={`nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleTabChange('users'); }}>
            <Users size={20} />
            {t('sidebar.users')}
          </a>
          <a href="#" className={`nav-item ${activeTab === 'webhooks' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleTabChange('webhooks'); }}>
            <BellRing size={20} />
            {t('sidebar.webhooks')}
          </a>
          <a href="#" className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleTabChange('settings'); }}>
            <Settings size={20} />
            {t('sidebar.settings')}
          </a>
        </nav>

        <div className="api-key-section">
          <label htmlFor="apiKey" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <KeyRound size={16} /> {t('sidebar.apiKey')}
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
              {t('sidebar.save')}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="header-info">
            <h2>
              {activeTab === 'revenue' && t('header.revenue')}
              {activeTab === 'servers' && t('header.servers')}
              {activeTab === 'users' && t('header.users')}
              {activeTab === 'webhooks' && t('header.webhooks')}
              {activeTab === 'settings' && t('header.settings')}
            </h2>
            <p className="subtitle">
              {activeTab === 'revenue' && t('header.revenueDesc')}
              {activeTab === 'servers' && t('header.serversDesc')}
              {activeTab === 'users' && t('header.usersDesc')}
              {activeTab === 'webhooks' && t('header.webhooksDesc')}
              {activeTab === 'settings' && t('header.settingsDesc')}
            </p>
          </div>
          
          <div className="lang-switcher">
             <button 
                onClick={toggleLanguage} 
                className="glass-input" 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px 16px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
             >
                <Globe size={18} />
                <span style={{ fontWeight: 'bold' }}>{i18n.language.toUpperCase()}</span>
             </button>
          </div>
        </header>

        <div className="content-body">
          {mountedTabs.revenue && (
            <div style={{ display: activeTab === 'revenue' ? 'block' : 'none', height: '100%', overflow: 'auto' }}>
              <RevenuePage />
            </div>
          )}
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
          {mountedTabs.webhooks && (
            <div style={{ display: activeTab === 'webhooks' ? 'block' : 'none', height: '100%' }}>
              <IapWebhooksPage />
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
