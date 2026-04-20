import { useEffect, useState } from 'react';
import { useAdminStore } from '../hooks/useAdminStore';
import { RefreshCw, FileJson } from 'lucide-react';

export default function IapWebhooksPage() {
    const { webhooks, isLoadingWebhooks, fetchWebhooks, apiKey } = useAdminStore();
    const [selectedPayload, setSelectedPayload] = useState<any | null>(null);

    useEffect(() => {
        if (apiKey) fetchWebhooks();
    }, [apiKey, fetchWebhooks]);

    return (
        <div className="section content-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>App Store Webhook Logs</h3>
                <button className="secondary-btn glow-effect" onClick={fetchWebhooks} disabled={isLoadingWebhooks}>
                    <RefreshCw size={16} /> Refresh logs
                </button>
            </div>

            <div className="table-container glass-panel">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Notification Type</th>
                            <th>Subtype</th>
                            <th>Environment</th>
                            <th>Product ID</th>
                            <th className="text-right">Payload</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoadingWebhooks ? (
                            <tr>
                                <td colSpan={6} className="text-center loading-text">Loading Webhooks...</td>
                            </tr>
                        ) : webhooks.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center text-muted">No webhooks recorded.</td>
                            </tr>
                        ) : (
                            webhooks.map((log) => {
                                const data = log?.data || {};
                                const txInfo = data?.signedTransactionInfo || {};
                                
                                return (
                                    <tr key={log.id}>
                                        <td>{log.createdAt ? new Date(log.createdAt).toLocaleString() : 'Unknown'}</td>
                                        <td>
                                            <span style={{ fontWeight: 'bold', color: 'var(--accent)' }}>
                                                {log.notificationType || 'UNKNOWN'}
                                            </span>
                                        </td>
                                        <td>{log.subtype || '-'}</td>
                                        <td>{data.environment || '-'}</td>
                                        <td>
                                            <small style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                                                {txInfo.productId || '-'}
                                            </small>
                                        </td>
                                        <td className="text-right">
                                            <button 
                                                className="action-btn edit" 
                                                onClick={() => setSelectedPayload(log)} 
                                                title="View Raw JSON"
                                            >
                                                <FileJson size={16} /> View
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {selectedPayload && (
                <div className="modal-overlay">
                    <div className="modal-content glass-panel" style={{ width: '80%', maxWidth: '800px' }}>
                        <div className="modal-header">
                            <h3>Raw Apple Webhook Payload</h3>
                            <button className="close-btn" onClick={() => setSelectedPayload(null)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <pre style={{ 
                                backgroundColor: 'rgba(0,0,0,0.3)', 
                                padding: '16px', 
                                borderRadius: '8px', 
                                overflowX: 'auto',
                                fontFamily: 'monospace',
                                fontSize: '0.85em',
                                color: '#e2e8f0'
                            }}>
                                {JSON.stringify(selectedPayload, null, 2)}
                            </pre>
                        </div>
                        <div className="modal-footer">
                            <button className="primary-btn glow-effect" onClick={() => setSelectedPayload(null)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
