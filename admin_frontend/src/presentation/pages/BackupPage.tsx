import React, { useState } from 'react';
import { useAdminStore } from '../hooks/useAdminStore';
import { useTranslation } from 'react-i18next';
import { useToast } from '../components/ToastContext';

export default function BackupPage() {
    const { t } = useTranslation();
    const { apiKey } = useAdminStore();
    const [isRestoring, setIsRestoring] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const { showToast } = useToast();

    const handleDownload = async () => {
        try {
            const response = await fetch('/api/admin/backup', {
                method: 'GET',
                headers: {
                    'x-admin-key': apiKey
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch backup');
            }

            const data = await response.json();
            
            if (data.success && data.data) {
                const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `vpn_backup_${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                showToast('Backup downloaded successfully', 'success');
            } else {
                throw new Error('Invalid response structure');
            }
        } catch (error) {
            console.error(error);
            showToast(t('backup_failed'), 'error');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleRestore = async () => {
        if (!file) return;

        if (!window.confirm(t('confirm_restore'))) {
            return;
        }

        setIsRestoring(true);

        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const content = event.target?.result as string;
                    const parsedData = JSON.parse(content);

                    const response = await fetch('/api/admin/restore', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-admin-key': apiKey
                        },
                        body: JSON.stringify({ data: parsedData.data ? parsedData.data : parsedData })
                    });

                    if (!response.ok) {
                        throw new Error('Restore request failed');
                    }

                    const resData = await response.json();
                    if (resData.success) {
                        showToast(t('restore_success'), 'success');
                        setFile(null);
                        // Clear the input
                        const fileInput = document.getElementById('backupFileInput') as HTMLInputElement;
                        if (fileInput) fileInput.value = '';
                    } else {
                        throw new Error(resData.error || 'Restore failed');
                    }
                } catch (err: any) {
                    console.error('Error in restore parsing/upload:', err);
                    showToast(`${t('restore_failed')} ${err.message || ''}`, 'error');
                } finally {
                    setIsRestoring(false);
                }
            };
            reader.readAsText(file);
        } catch (error: any) {
            console.error(error);
            showToast(t('restore_failed'), 'error');
            setIsRestoring(false);
        }
    };

    return (
        <div className="section content-section">
            <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
                <h3>{t('download_backup')}</h3>
                <p className="text-muted" style={{ marginBottom: '16px' }}>{t('backup_restore_desc')}</p>
                <button className="primary-btn glow-effect" onClick={handleDownload} style={{ width: 'auto' }}>
                    ⬇ {t('download_backup')}
                </button>
            </div>

            <div className="glass-panel" style={{ padding: '24px' }}>
                <h3>{t('upload_restore')}</h3>
                <p className="text-muted" style={{ marginBottom: '16px' }}>{t('confirm_restore')}</p>
                
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <input 
                        id="backupFileInput"
                        type="file" 
                        accept=".json" 
                        onChange={handleFileChange}
                        className="glass-input" 
                        style={{ padding: '6px' }}
                    />
                    <button 
                        className="primary-btn" 
                        style={{ backgroundColor: file ? '#ef4444' : 'gray', color: '#fff' }} 
                        onClick={handleRestore} 
                        disabled={!file || isRestoring}
                    >
                        {isRestoring ? t('restoring') : `⬆ ${t('upload_restore')}`}
                    </button>
                </div>
            </div>
        </div>
    );
}
