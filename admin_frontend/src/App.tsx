import { useState } from 'react';
import { useAdminStore } from './presentation/hooks/useAdminStore';
import ServersPage from './presentation/pages/ServersPage';
import UsersPage from './presentation/pages/UsersPage';
import SettingsPage from './presentation/pages/SettingsPage';
import BackupPage from './presentation/pages/BackupPage';
import { useToast } from './presentation/components/ToastContext';
import { LayoutDashboard, Users, Settings, KeyRound, Globe, Database, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function App() {
  const [activeTab, setActiveTab] = useState<'servers' | 'users' | 'settings' | 'backup'>('servers');
  const [mountedTabs, setMountedTabs] = useState({ servers: true, users: false, settings: false, backup: false });
  const { apiKey, setApiKey } = useAdminStore();
  const [tempKey, setTempKey] = useState('');
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();

  const handleTabChange = (tab: 'servers' | 'users' | 'settings' | 'backup') => {
    setActiveTab(tab);
    if (!mountedTabs[tab]) {
      setMountedTabs(prev => ({ ...prev, [tab]: true }));
    }
  };

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempKey.trim()) return;

    setIsLoggingIn(true);
    try {
      // Validate key by trying to fetch settings
      const res = await fetch('/api/admin/settings', {
        headers: { 'x-admin-key': tempKey }
      });
      
      if (res.ok) {
        setApiKey(tempKey);
        showToast('Login successful!', 'success');
      } else {
        showToast("Invalid API Key. Access Denied.", 'error');
        setTempKey('');
      }
    } catch (error) {
      console.error(error);
      showToast("Network error. Could not validate API key.", 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setApiKey('');
    setTempKey('');
    showToast('Logged out successfully.', 'info');
  };

  if (!apiKey) {
    return (
      <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="glass-panel" style={{ padding: '40px', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <div className="logo" style={{ justifyContent: 'center', marginBottom: '24px' }}>
            <span className="logo-icon" style={{ fontSize: '3rem' }}>🚀</span>
          </div>
          <h2 style={{ marginBottom: '8px' }}>{t('vpn_admin')}</h2>
          <p className="text-muted" style={{ marginBottom: '32px' }}>Please authenticate to continue</p>
          
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '24px', textAlign: 'left' }}>
              <label htmlFor="apiKey" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <KeyRound size={16} /> {t('api_key_dev')}
              </label>
              <input 
                type="password" 
                id="apiKey" 
                placeholder={t('enter_api_key')} 
                className="glass-input" 
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                style={{ width: '100%', padding: '12px' }}
                autoFocus
              />
            </div>
            <button 
              type="submit"
              className="primary-btn glow-effect" 
              disabled={!tempKey.trim() || isLoggingIn}
              style={{ width: '100%', padding: '12px', fontSize: '1rem', justifyContent: 'center' }}
            >
              {isLoggingIn ? "Logging in..." : "Login"}
            </button>
          </form>

          <div style={{ marginTop: '32px', textAlign: 'center' }}>
            <select 
              className="glass-input" 
              style={{ padding: '8px', width: 'auto', display: 'inline-block' }}
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
            >
              <option value="en" style={{ color: '#000' }}>{t('english')}</option>
              <option value="vi" style={{ color: '#000' }}>{t('vietnamese')}</option>
            </select>
          </div>
        </div>
      </div>
    );
  }

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
          <a href="#" className={`nav-item ${activeTab === 'backup' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleTabChange('backup'); }}>
            <Database size={20} />
            {t('backup_restore')}
          </a>
        </nav>

        <div className="api-key-section" style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
          <button 
            className="nav-item" 
            onClick={handleLogout}
            style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left', color: '#ff4d4f', padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
          >
            <LogOut size={20} />
            Logout
          </button>
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
              {activeTab === 'backup' && t('backup_restore')}
            </h2>
            <p className="subtitle">
              {activeTab === 'servers' && t('monitor_configure_servers')}
              {activeTab === 'users' && t('monitor_user_accounts')}
              {activeTab === 'settings' && t('configure_global_behavior')}
              {activeTab === 'backup' && t('backup_restore_desc')}
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
          {mountedTabs.backup && (
            <div style={{ display: activeTab === 'backup' ? 'block' : 'none', height: '100%' }}>
              <BackupPage />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
