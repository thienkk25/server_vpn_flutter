import { useEffect, useState } from 'react';
import { useAdminStore } from '../hooks/useAdminStore';

export default function SettingsPage() {
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
            const parsedSeconds = parseInt(formData.get('flashSaleTimerSeconds') as string, 10);
            await updateSettings({
                maintenanceMode: formData.get('maintenanceMode') === 'on',
                privacyPolicyUrl: formData.get('privacyPolicyUrl') as string,
                termsOfServiceUrl: formData.get('termsOfServiceUrl') as string,
                systemMessage: formData.get('systemMessage') as string,
                flashSaleTimerSeconds: isNaN(parsedSeconds) ? 7200 : parsedSeconds
            });
            alert('Settings saved successfully!');
        } catch (error) {
            alert('Error saving settings');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoadingSettings) {
        return <div className="text-center loading-text">Loading settings...</div>;
    }

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
                            <strong>Enable Maintenance Mode</strong>
                        </label>
                        <p className="text-muted" style={{ marginTop: '5px', fontSize: '0.9em' }}>
                            If enabled, users might be restricted from accessing the VPN network.
                        </p>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Privacy Policy URL</label>
                            <input 
                                type="url" 
                                name="privacyPolicyUrl" 
                                className="glass-input" 
                                defaultValue={settings?.privacyPolicyUrl} 
                                placeholder="https://..." 
                            />
                        </div>
                        <div className="form-group">
                            <label>Terms of Service URL</label>
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
                        <label>System Message (Announcement)</label>
                        <textarea 
                            name="systemMessage" 
                            className="glass-input" 
                            rows={3} 
                            defaultValue={settings?.systemMessage} 
                            placeholder="Leave empty for no announcement" 
                        />
                    </div>
                    <div className="form-group">
                        <label>Flash Sale Countdown (Seconds)</label>
                        <input 
                            type="number" 
                            name="flashSaleTimerSeconds" 
                            className="glass-input" 
                            defaultValue={settings?.flashSaleTimerSeconds ?? 7200} 
                            placeholder="e.g. 7200 for 2 hours (0 to disable)" 
                        />
                        <p className="text-muted" style={{ marginTop: '5px', fontSize: '0.9em' }}>
                            Duration of the fake flash sale countdown in the app (e.g., 7200 = 2 hours, 0 = disable sale).
                        </p>
                    </div>
                    <div className="form-group text-right" style={{ marginTop: '20px' }}>
                        <button type="submit" disabled={isSaving} className="primary-btn glow-effect">
                            {isSaving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
