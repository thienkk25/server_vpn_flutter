import { useEffect, useState } from 'react';
import { useAdminStore } from '../hooks/useAdminStore';
import { useTranslation } from 'react-i18next';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function LegalPage() {
    const { t } = useTranslation();
    const { settings, isLoadingSettings, fetchSettings, updateSettings, apiKey } = useAdminStore();
    const [isSaving, setIsSaving] = useState(false);
    
    const [privacyContent, setPrivacyContent] = useState('');
    const [termsContent, setTermsContent] = useState('');
    
    const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>('privacy');

    useEffect(() => {
        if (apiKey) fetchSettings();
    }, [apiKey, fetchSettings]);

    useEffect(() => {
        if (settings) {
            setPrivacyContent(settings.privacyPolicyContent || '');
            setTermsContent(settings.termsOfServiceContent || '');
        }
    }, [settings]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateSettings({
                privacyPolicyContent: privacyContent,
                termsOfServiceContent: termsContent,
            });
            alert(t('legalPage.saveSuccess'));
        } catch (error) {
            alert(t('legalPage.saveError'));
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoadingSettings) {
        return <div className="text-center loading-text">{t('legalPage.loading')}</div>;
    }

    return (
        <div className="section content-section">
            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <button 
                        style={{
                            flex: 1, padding: '16px', background: activeTab === 'privacy' ? 'rgba(255,255,255,0.05)' : 'transparent',
                            border: 'none', color: activeTab === 'privacy' ? 'white' : 'rgba(255,255,255,0.5)',
                            cursor: 'pointer', fontWeight: activeTab === 'privacy' ? 'bold' : 'normal',
                            transition: 'all 0.3s'
                        }}
                        onClick={() => setActiveTab('privacy')}
                    >
                        {t('legalPage.privacyTab')}
                    </button>
                    <button 
                        style={{
                            flex: 1, padding: '16px', background: activeTab === 'terms' ? 'rgba(255,255,255,0.05)' : 'transparent',
                            border: 'none', color: activeTab === 'terms' ? 'white' : 'rgba(255,255,255,0.5)',
                            cursor: 'pointer', fontWeight: activeTab === 'terms' ? 'bold' : 'normal',
                            transition: 'all 0.3s'
                        }}
                        onClick={() => setActiveTab('terms')}
                    >
                        {t('legalPage.termsTab')}
                    </button>
                </div>
                
                <div style={{ padding: '24px' }}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                            {activeTab === 'privacy' ? t('legalPage.privacyContent') : t('legalPage.termsContent')}
                        </label>
                        <div style={{ background: 'white', color: 'black', borderRadius: '8px', overflow: 'hidden', display: activeTab === 'privacy' ? 'block' : 'none' }}>
                            <ReactQuill 
                                theme="snow" 
                                value={privacyContent} 
                                onChange={setPrivacyContent}
                                style={{ height: '400px', border: 'none' }}
                            />
                        </div>
                        <div style={{ background: 'white', color: 'black', borderRadius: '8px', overflow: 'hidden', display: activeTab === 'terms' ? 'block' : 'none' }}>
                            <ReactQuill 
                                theme="snow" 
                                value={termsContent} 
                                onChange={setTermsContent}
                                style={{ height: '400px', border: 'none' }}
                            />
                        </div>
                    </div>
                </div>

                <div style={{ padding: '0 24px 24px 24px', textAlign: 'right' }}>
                    <button onClick={handleSave} disabled={isSaving} className="primary-btn glow-effect" style={{ marginTop: '30px' }}>
                        {isSaving ? t('legalPage.saving') : t('legalPage.saveChanges')}
                    </button>
                </div>
            </div>
        </div>
    );
}
