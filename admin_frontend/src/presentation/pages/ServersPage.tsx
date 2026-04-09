import { useEffect, useState, useRef } from 'react';
import { useAdminStore } from '../hooks/useAdminStore';
import { Edit2, Trash2, Plus, RefreshCw } from 'lucide-react';
import type { ServerEntity } from '../../domain/entities/admin';

export default function ServersPage() {
    const { servers, isLoadingServers, fetchServers, saveServer, deleteServer, importServers, apiKey } = useAdminStore();
    
    // Helper to conditionally Base64 encode if not already encoded
    const ensureBase64 = (text: string) => {
        if (!text || text.trim() === '') return '';
        const noSpaceStr = text.replace(/[\r\n\s]/g, '');
        const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
        
        if (base64Regex.test(noSpaceStr)) {
            try {
                atob(noSpaceStr);
                return text; // Already a valid base64 string
            } catch (e) {
                // Ignore and encode
            }
        }
        
        // Encode to base64
        const bytes = new TextEncoder().encode(text);
        const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
        return btoa(binString);
    };
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingServer, setEditingServer] = useState<Partial<ServerEntity> | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isDeletingBulk, setIsDeletingBulk] = useState(false);

    const toggleSelectAll = () => {
        if (servers.length === 0) return;
        if (selectedIds.length === servers.length) {
            setSelectedIds([]);
        } else {
            const validIds = servers.map(s => s.id).filter(Boolean) as string[];
            setSelectedIds(validIds);
        }
    };

    const toggleSelect = (id: string | undefined) => {
        if (!id) return;
        if (selectedIds.includes(id)) {
            setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
        } else {
            setSelectedIds(prev => [...prev, id]);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (window.confirm(`Are you sure you want to delete ${selectedIds.length} server(s)?`)) {
            setIsDeletingBulk(true);
            try {
                for (const id of selectedIds) {
                    await deleteServer(id);
                }
                setSelectedIds([]);
            } catch (error: any) {
                alert(error.message || 'Failed to delete some servers');
            } finally {
                setIsDeletingBulk(false);
            }
        }
    };

    useEffect(() => {
        if (apiKey) fetchServers();
    }, [apiKey, fetchServers]);

    const jsonFileInputRef = useRef<HTMLInputElement>(null);
    const configFileInputRef = useRef<HTMLInputElement>(null);

    const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);
            if (!Array.isArray(data)) throw new Error('Data should be an array of servers.');
            
            if (window.confirm(`Found ${data.length} servers in file. Proceed to import?`)) {
                await importServers(data);
                alert('Import successful!');
            }
        } catch (error: any) {
            alert('Failed to parse or import JSON: ' + error.message);
        } finally {
            if (jsonFileInputRef.current) jsonFileInputRef.current.value = '';
        }
    };

    const handleUploadConfig = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const form = document.getElementById('serverForm') as HTMLFormElement | null;
            if (form) {
                // Show raw text in textarea for editing
                form.config.value = text;
                
                // Parse IP
                const remoteMatch = text.match(/remote\s+([a-zA-Z0-9.-]+)/i);
                if (remoteMatch && remoteMatch[1]) {
                    form.ip.value = remoteMatch[1];
                }

                // Determine protocol
                if (file.name.toLowerCase().endsWith('.conf')) {
                    form.protocol.value = 'WireGuard';
                } else if (file.name.toLowerCase().endsWith('.ovpn')) {
                    form.protocol.value = 'OpenVPN';
                }
            }
        } catch (error: any) {
            alert('Failed to read config file: ' + error.message);
        } finally {
            if (configFileInputRef.current) configFileInputRef.current.value = '';
        }
    };

    const handleSave = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMsg(null);
        setIsSaving(true);
        const formData = new FormData(e.currentTarget);
        const protocol = formData.get('protocol') as string;
        const configText = formData.get('config') as string || '';
        const safeConfig = ensureBase64(configText);

        const payload: Partial<ServerEntity> = {
            name: formData.get('name') as string,
            region: formData.get('region') as string || '',
            ip: formData.get('ip') as string,
            status: formData.get('status') === 'active' ? 1 : 0,
            onWireGuard: protocol === 'WireGuard' ? 1 : 0,
            isVip: formData.get('isVip') ? 1 : 0,
            password: formData.get('password') as string || '',
            config: protocol === 'OpenVPN' ? safeConfig : '',
            wireGuardConfig: protocol === 'WireGuard' ? safeConfig : '',
            version: parseInt(formData.get('version') as string, 10) || 1,
            username: formData.get('username') as string || ''
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {selectedIds.length > 0 && (
                        <button className="action-btn delete" onClick={handleBulkDelete} disabled={isDeletingBulk || isLoadingServers} style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', borderRadius: '8px', border: '1px solid currentColor' }}>
                            <Trash2 size={16} /> {isDeletingBulk ? 'Deleting...' : `Delete Selected (${selectedIds.length})`}
                        </button>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <input type="file" accept=".json" style={{ display: 'none' }} ref={jsonFileInputRef} onChange={handleImportJSON} />
                    <button className="secondary-btn" onClick={() => jsonFileInputRef.current?.click()} disabled={isLoadingServers}>
                        Import JSON
                    </button>
                    <button className="secondary-btn" onClick={fetchServers} disabled={isLoadingServers}>
                        <RefreshCw size={16} /> Refresh
                    </button>
                    <button className="primary-btn glow-effect" onClick={openCreate}>
                        <Plus size={16} /> New Server
                    </button>
                </div>
            </div>

            <div className="table-container glass-panel">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th style={{ width: '40px', textAlign: 'center' }}>
                                <input 
                                    type="checkbox" 
                                    checked={servers.length > 0 && selectedIds.length === servers.length}
                                    onChange={toggleSelectAll} 
                                    style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary-color)' }}
                                />
                            </th>
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
                                <td colSpan={7} className="text-center loading-text">Loading servers...</td>
                            </tr>
                        ) : servers.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center text-muted">No servers found. Add one to get started.</td>
                            </tr>
                        ) : (
                            servers.map(server => (
                                <tr key={server.id} style={{ backgroundColor: selectedIds.includes(server.id!) ? 'rgba(74, 158, 255, 0.05)' : 'inherit' }}>
                                    <td style={{ textAlign: 'center' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={selectedIds.includes(server.id!)}
                                            onChange={() => toggleSelect(server.id)} 
                                            style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary-color)' }}
                                        />
                                    </td>
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
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Server Name</label>
                                        <input type="text" name="name" className="glass-input" required defaultValue={editingServer?.name} placeholder="e.g. US East 1" />
                                    </div>
                                    <div className="form-group">
                                        <label>Region</label>
                                        <input type="text" name="region" className="glass-input" required defaultValue={editingServer?.region || ''} placeholder="e.g. US, SG..." />
                                    </div>
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
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Username</label>
                                        <input type="text" name="username" className="glass-input" defaultValue={editingServer?.username || ''} placeholder="e.g. vpn" />
                                    </div>
                                    <div className="form-group">
                                        <label>Version</label>
                                        <input type="number" name="version" className="glass-input" defaultValue={editingServer?.version || 1} placeholder="e.g. 1" min="1" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Password (Optional)</label>
                                    <input type="password" name="password" className="glass-input" defaultValue={editingServer?.password || ''} placeholder="Leave empty if none" />
                                </div>
                                <div className="form-group">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                        <label style={{ margin: 0 }}>Raw Config</label>
                                        <input type="file" accept=".ovpn,.conf" style={{ display: 'none' }} ref={configFileInputRef} onChange={handleUploadConfig} />
                                        <button type="button" className="secondary-btn" style={{ padding: '2px 8px', fontSize: '12px' }} onClick={() => configFileInputRef.current?.click()}>
                                            Upload File
                                        </button>
                                    </div>
                                    <textarea name="config" className="glass-input" rows={5} defaultValue={editingServer?.wireGuardConfig || editingServer?.config || ''} placeholder="Paste OpenVPN or WireGuard config here..."></textarea>
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
