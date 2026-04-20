import { useState } from 'react';
import { useAdminStore } from './presentation/hooks/useAdminStore';
import ServersPage from './presentation/pages/ServersPage';
import UsersPage from './presentation/pages/UsersPage';
import SettingsPage from './presentation/pages/SettingsPage';
import IapWebhooksPage from './presentation/pages/IapWebhooksPage';
import { RevenuePage } from './presentation/pages/RevenuePage';
import { LayoutDashboard, Users, Settings, KeyRound, BellRing, DollarSign, Globe, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function App() {
  const [activeTab, setActiveTab] = useState<'revenue' | 'servers' | 'users' | 'settings' | 'webhooks'>('revenue');
  const [mountedTabs, setMountedTabs] = useState({ revenue: true, servers: false, users: false, settings: false, webhooks: false });
  const { apiKey, setApiKey } = useAdminStore();
  const [loginKey, setLoginKey] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
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

  const handleLogout = () => {
    setApiKey('');
    setLoginKey('');
    setErrorMsg('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginKey.trim()) return;

    setIsLoggingIn(true);
    setErrorMsg('');
    try {
      // Xác thực thử bằng cách gọi nhẹ 1 API với key truyền trực tiếp
      const response = await fetch('/api/admin/settings', {
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': loginKey
        }
      });

      if (!response.ok) {
        throw new Error('Key không hợp lệ / Invalid API Key');
      }

      setApiKey(loginKey);
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (!apiKey) {
    return (
       <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', height: '100vh', width: '100vw' }}>
          <div className="glass-panel" style={{ margin: 'auto', width: '100%', maxWidth: '400px', padding: '40px 30px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ marginBottom: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, var(--accent-color), #a29bfe)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', boxShadow: '0 10px 25px var(--accent-glow)' }}>
                      <KeyRound size={32} color="white" />
                  </div>
                  <h1 style={{ fontSize: '2rem', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>{t('login.title')}</h1>
                  <p className="text-muted" style={{ fontSize: '0.9rem' }}>{t('login.subtitle')}</p>
              </div>
              
              <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                      <div style={{ position: 'relative' }}>
                          <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                              <KeyRound size={20} className="text-muted" />
                          </div>
                          <input
                              type="password"
                              value={loginKey}
                              onChange={(e) => { setLoginKey(e.target.value); setErrorMsg(''); }}
                              className="glass-input"
                              style={{ paddingLeft: '48px', paddingRight: '16px', height: '50px' }}
                              placeholder={t('login.placeholder')}
                          />
                      </div>
                      {errorMsg && <p className="text-danger" style={{ marginTop: '10px', fontSize: '0.85rem' }}>{errorMsg}</p>}
                  </div>
                  
                  <button 
                    type="submit" 
                    className="primary-btn glow-effect"
                    disabled={isLoggingIn || !loginKey} 
                    style={{ width: '100%', height: '50px', fontSize: '1rem', marginTop: '10px', opacity: (isLoggingIn || !loginKey) ? 0.7 : 1 }}
                  >
                      {isLoggingIn ? t('login.verifying') : t('login.accessBtn')}
                  </button>
              </form>
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
          <button
            className="primary-btn glow-effect"
            onClick={handleLogout}
            style={{ width: '100%', padding: '10px', fontSize: '0.9em', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
          >
            <LogOut size={16} /> {t('sidebar.logout') || 'Logout'}
          </button>
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
