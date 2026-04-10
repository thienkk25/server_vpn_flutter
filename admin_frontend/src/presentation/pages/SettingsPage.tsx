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
            const flashSaleEndDateVal = formData.get('flashSaleEndDate') as string;
            const flashSaleEndDate = flashSaleEndDateVal ? new Date(flashSaleEndDateVal).toISOString() : null;

            await updateSettings({
                maintenanceMode: formData.get('maintenanceMode') === 'on',
                privacyPolicyUrl: formData.get('privacyPolicyUrl') as string,
                termsOfServiceUrl: formData.get('termsOfServiceUrl') as string,
                systemMessage: formData.get('systemMessage') as string,
                flashSaleEndDate: flashSaleEndDate
            });
            alert(t('settings_saved'));
        } catch (error) {
            alert(t('error_saving_settings'));
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoadingSettings) {
        return <div className="text-center loading-text">{t('loading_settings')}</div>;
    }

    const toDatetimeLocal = (isoString?: string | null) => {
        if (!isoString) return '';
        try {
            const date = new Date(isoString);
            date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
            return date.toISOString().slice(0,16);
        } catch {
            return '';
        }
    };

    return (
        <div className="section content-section">
            <div className="glass-panel" style={{ padding: '24px' }}>
                <form id="settingsForm" onSubmit={handleSave}>
                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input 
                                type="checkbox" 
                                name="maintenanceMode" 
                                defaultChecked={settings?.maintenanceMode} 
                                style={{ width: '20px', height: '20px' }} 
                            />
                            <strong>{t('enable_maintenance')}</strong>
                        </label>
                        <p className="text-muted" style={{ marginTop: '5px', fontSize: '0.9em' }}>
                            {t('maintenance_desc')}
                        </p>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>{t('privacy_policy_url')}</label>
                            <input 
                                type="url" 
                                name="privacyPolicyUrl" 
                                className="glass-input" 
                                defaultValue={settings?.privacyPolicyUrl} 
                                placeholder="https://..." 
                            />
                        </div>
                        <div className="form-group">
                            <label>{t('tos_url')}</label>
                            <input 
                                type="url" 
                                name="termsOfServiceUrl" 
                                className="glass-input" 
                                defaultValue={settings?.termsOfServiceUrl} 
                                placeholder="https://..." 
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>{t('system_message')}</label>
                        <textarea 
                            name="systemMessage" 
                            className="glass-input" 
                            rows={3} 
                            defaultValue={settings?.systemMessage} 
                            placeholder={t('leave_empty_no_announcement')} 
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('flash_sale_end')}</label>
                        <input 
                            type="datetime-local" 
                            name="flashSaleEndDate" 
                            className="glass-input" 
                            defaultValue={toDatetimeLocal(settings?.flashSaleEndDate)} 
                        />
                        <p className="text-muted" style={{ marginTop: '5px', fontSize: '0.9em' }}>
                            {t('flash_sale_desc')}
                        </p>
                    </div>
                    <div className="form-group text-right" style={{ marginTop: '20px' }}>
                        <button type="submit" disabled={isSaving} className="primary-btn glow-effect">
                            {isSaving ? t('saving') : t('save_settings')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
