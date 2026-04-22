import { useEffect, useState } from 'react';
import { useAdminStore } from '../hooks/useAdminStore';
import { useTranslation } from 'react-i18next';

export default function SettingsPage() {
    const { t } = useTranslation();
    const { settings, isLoadingSettings, fetchSettings, updateSettings, apiKey } = useAdminStore();
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (apiKey) fetchSettings();
    }, [apiKey, fetchSettings]);

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        const formData = new FormData(e.currentTarget);
        
        try {
            await updateSettings({
                privacyPolicyUrl: formData.get('privacyPolicyUrl') as string,
                termsOfServiceUrl: formData.get('termsOfServiceUrl') as string,
            });
            alert(t('settingsPage.saveSuccess'));
        } catch (error) {
            alert(t('settingsPage.saveError'));
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoadingSettings) {
        return <div className="text-center loading-text">{t('settingsPage.loading')}</div>;
    }

    return (
        <div className="section content-section">
            <div className="glass-panel" style={{ padding: '24px' }}>
                <form id="settingsForm" onSubmit={handleSave}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>{t('settingsPage.privacyUrl')}</label>
                            <input 
                                type="url" 
                                name="privacyPolicyUrl" 
                                className="glass-input" 
                                defaultValue={settings?.privacyPolicyUrl} 
                                placeholder="https://..." 
                            />
                        </div>
                        <div className="form-group">
                            <label>{t('settingsPage.termsUrl')}</label>
                            <input 
                                type="url" 
                                name="termsOfServiceUrl" 
                                className="glass-input" 
                                defaultValue={settings?.termsOfServiceUrl} 
                                placeholder="https://..." 
                            />
                        </div>
                    </div>
                    <div className="form-group text-right" style={{ marginTop: '20px' }}>
                        <button type="submit" disabled={isSaving} className="primary-btn glow-effect">
                            {isSaving ? t('settingsPage.saving') : t('settingsPage.saveSettings')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
