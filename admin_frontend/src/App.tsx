import { useState } from 'react';
import { useAdminStore } from './presentation/hooks/useAdminStore';
import ServersPage from './presentation/pages/ServersPage';
import SettingsPage from './presentation/pages/SettingsPage';
import LegalPage from './presentation/pages/LegalPage';
import { LayoutDashboard, Settings, KeyRound, Globe, LogOut, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function App() {
  const [activeTab, setActiveTab] = useState<'servers' | 'settings' | 'legal'>('servers');
  const [mountedTabs, setMountedTabs] = useState({ servers: true, settings: false, legal: false });
  const { apiKey, setApiKey } = useAdminStore();
  const [loginKey, setLoginKey] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'vi' : 'en';
    i18n.changeLanguage(newLang);
  };

  const handleTabChange = (tab: 'servers' | 'settings' | 'legal') => {
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
          <a href="#" className={`nav-item ${activeTab === 'servers' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleTabChange('servers'); }}>
            <LayoutDashboard size={20} />
            {t('sidebar.servers')}
          </a>
          <a href="#" className={`nav-item ${activeTab === 'legal' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleTabChange('legal'); }}>
            <FileText size={20} />
            {t('sidebar.legal')}
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
              {activeTab === 'servers' && t('header.servers')}
              {activeTab === 'settings' && t('header.settings')}
              {activeTab === 'legal' && t('header.legal')}
            </h2>
            <p className="subtitle">
              {activeTab === 'servers' && t('header.serversDesc')}
              {activeTab === 'settings' && t('header.settingsDesc')}
              {activeTab === 'legal' && t('header.legalDesc')}
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
          {mountedTabs.servers && (
            <div style={{ display: activeTab === 'servers' ? 'block' : 'none', height: '100%' }}>
              <ServersPage />
            </div>
          )}
          {mountedTabs.legal && (
            <div style={{ display: activeTab === 'legal' ? 'block' : 'none', height: '100%' }}>
              <LegalPage />
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
