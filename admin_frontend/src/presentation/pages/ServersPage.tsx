import { useEffect, useState } from 'react';
import { useAdminStore } from '../hooks/useAdminStore';
import { Edit2, Trash2, Plus, RefreshCw } from 'lucide-react';
import type { ServerEntity } from '../../domain/entities/admin';

export default function ServersPage() {
    const { servers, isLoadingServers, fetchServers, saveServer, deleteServer, apiKey } = useAdminStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingServer, setEditingServer] = useState<Partial<ServerEntity> | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        if (apiKey) fetchServers();
    }, [apiKey, fetchServers]);

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMsg(null);
        setIsSaving(true);
        const formData = new FormData(e.currentTarget);
        const payload: Partial<ServerEntity> = {
            name: formData.get('name') as string,
            ip: formData.get('ip') as string,
            status: formData.get('status') === 'active' ? 1 : 0,
            onWireGuard: formData.get('protocol') === 'WireGuard' ? 1 : 0,
            isVip: formData.get('isVip') ? 1 : 0,
            password: formData.get('password') as string,
            config: formData.get('config') as string,
            version: 3,
            username: 'vpn'
        };

        try {
            await saveServer(editingServer?.id || null, payload);
            setIsModalOpen(false);
        } catch (error: any) {
            setErrorMsg(error.message || 'Failed to save server');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string | undefined) => {
        if (!id) return;
        if (window.confirm('Are you sure you want to delete this server?')) {
            setDeletingId(id);
            try {
                await deleteServer(id);
            } catch (error: any) {
                alert(error.message || 'Failed to delete server');
            } finally {
                setDeletingId(null);
            }
        }
    };

    const openEdit = (server: ServerEntity) => {
        setEditingServer(server);
        setErrorMsg(null);
        setIsModalOpen(true);
    };

    const openCreate = () => {
        setEditingServer(null);
        setErrorMsg(null);
        setIsModalOpen(true);
    };

    return (
        <div className="section content-section">
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '20px' }}>
                <button className="secondary-btn" onClick={fetchServers} disabled={isLoadingServers}>
                    <RefreshCw size={16} /> Refresh
                </button>
                <button className="primary-btn glow-effect" onClick={openCreate}>
                    <Plus size={16} /> New Server
                </button>
            </div>

            <div className="table-container glass-panel">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Host / IP</th>
                            <th>Protocol</th>
                            <th>Status</th>
                            <th>Tier</th>
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoadingServers ? (
                            <tr>
                                <td colSpan={6} className="text-center loading-text">Loading servers...</td>
                            </tr>
                        ) : servers.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center text-muted">No servers found. Add one to get started.</td>
                            </tr>
                        ) : (
                            servers.map(server => (
                                <tr key={server.id}>
                                    <td><strong>{server.name}</strong></td>
                                    <td>{server.ip || '-'}</td>
                                    <td>{server.onWireGuard === 1 ? 'WireGuard' : 'OpenVPN'}</td>
                                    <td>
                                        <span className={`status-badge ${server.status === 1 ? 'active' : 'offline'}`}>
                                            {server.status === 1 ? 'ACTIVE' : 'OFFLINE'}
                                        </span>
                                    </td>
                                    <td>
                                        <span 
                                            className={`status-badge ${server.isVip === 1 ? 'active' : 'offline'}`} 
                                            style={{
                                                backgroundColor: server.isVip === 1 ? '#ffb020' : 'var(--glass-bg-accent)',
                                                color: server.isVip === 1 ? '#000' : 'var(--text-light)'
                                            }}
                                        >
                                            {server.isVip === 1 ? 'VIP' : 'FREE'}
                                        </span>
                                    </td>
                                    <td className="text-right">
                                        <button className="action-btn edit" onClick={() => openEdit(server)} style={{ marginRight: 8 }} disabled={deletingId === server.id}>
                                            <Edit2 size={14} /> Edit
                                        </button>
                                        <button className="action-btn delete" onClick={() => handleDelete(server.id)} disabled={deletingId === server.id}>
                                            <Trash2 size={14} /> {deletingId === server.id ? 'Deleting...' : 'Del'}
                                        </button>

                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content glass-panel">
                        <div className="modal-header">
                            <h3>{editingServer ? 'Edit Server' : 'Add New Server'}</h3>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            {errorMsg && (
                                <div style={{ padding: '10px', backgroundColor: 'rgba(255, 59, 48, 0.1)', color: '#ff3b30', border: '1px solid currentColor', borderRadius: '8px', marginBottom: '16px' }}>
                                    {errorMsg}
                                </div>
                            )}
                            <form id="serverForm" onSubmit={handleSave}>
                                <div className="form-group">
                                    <label>Server Name</label>
                                    <input type="text" name="name" className="glass-input" required defaultValue={editingServer?.name} placeholder="e.g. US East 1" />
                                </div>
                                <div className="form-group">
                                    <label>Host (IP/Domain)</label>
                                    <input type="text" name="ip" className="glass-input" required defaultValue={editingServer?.ip} placeholder="192.168.1.1" />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Protocol</label>
                                        <select name="protocol" className="glass-input" defaultValue={editingServer?.onWireGuard === 1 ? 'WireGuard' : 'OpenVPN'}>
                                            <option value="OpenVPN">OpenVPN</option>
                                            <option value="WireGuard">WireGuard</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Status</label>
                                        <select name="status" className="glass-input" defaultValue={editingServer?.status === 1 ? 'active' : 'offline'}>
                                            <option value="active">Active</option>
                                            <option value="offline">Offline</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input type="checkbox" name="isVip" id="serverIsVip" defaultChecked={editingServer?.isVip === 1} style={{ width: 16, height: 16 }} />
                                    <label htmlFor="serverIsVip" style={{ margin: 0, padding: 0 }}>Require VIP Subscription</label>
                                </div>
                                <div className="form-group">
                                    <label>Password (Optional)</label>
                                    <input type="password" name="password" className="glass-input" defaultValue={editingServer?.password} placeholder="Leave empty if none" />
                                </div>
                                <div className="form-group">
                                    <label>Raw Config</label>
                                    <textarea name="config" className="glass-input" rows={5} defaultValue={editingServer?.config} placeholder="Paste OpenVPN or other config here..."></textarea>
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="secondary-btn" onClick={() => setIsModalOpen(false)} disabled={isSaving}>Cancel</button>
                            <button type="submit" form="serverForm" className="primary-btn glow-effect" disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save Server'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
