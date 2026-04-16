import { useEffect, useState, useRef } from 'react';
import { useAdminStore } from '../hooks/useAdminStore';
import { Edit2, Trash2, Plus, RefreshCw } from 'lucide-react';
import type { ServerEntity } from '../../domain/entities/admin';
import { useTranslation } from 'react-i18next';
import { useToast } from '../components/ToastContext';

export default function ServersPage() {
    const { t } = useTranslation();
    const { servers, isLoadingServers, fetchServers, saveServer, deleteServer, importServers, apiKey } = useAdminStore();
    const { showToast } = useToast();

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
    const [selectedProtocol, setSelectedProtocol] = useState<string>('OpenVPN');
    const [isSaving, setIsSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isDeletingBulk, setIsDeletingBulk] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 6;

    // Pagination derived data
    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentServers = servers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(servers.length / ITEMS_PER_PAGE);

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
        if (window.confirm(t('confirm_delete_server'))) {
            setIsDeletingBulk(true);
            try {
                for (const id of selectedIds) {
                    await deleteServer(id);
                }
                showToast(t('delete_selected', { count: selectedIds.length }) + ' successful', 'success');
                setSelectedIds([]);
            } catch (error: any) {
                showToast(error.message || t('failed_delete_server'), 'error');
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
            if (!Array.isArray(data)) throw new Error(t('failed_import_json'));

            if (window.confirm(t('found_servers', { count: data.length }))) {
                await importServers(data);
                showToast(t('import_successful'), 'success');
            }
        } catch (error: any) {
            showToast(t('failed_import_json') + ' ' + error.message, 'error');
        } finally {
            if (jsonFileInputRef.current) jsonFileInputRef.current.value = '';
        }
    };

    const handleUploadConfig = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const form = document.getElementById('serverForm') as any;
            if (form) {
                // Parse IP
                const remoteMatch = text.match(/remote\s+([a-zA-Z0-9.-]+)/i);
                if (remoteMatch && remoteMatch[1] && form.ip) {
                    form.ip.value = remoteMatch[1];
                }

                // Determine protocol
                const extStr = file.name.toLowerCase();
                const isWgFile = extStr.endsWith('.conf') || text.includes('[Interface]');

                if (selectedProtocol === 'Both') {
                    if (isWgFile) {
                        if (form.config_wireguard) form.config_wireguard.value = text;
                    } else {
                        if (form.config_openvpn) form.config_openvpn.value = text;
                    }
                } else {
                    if (form.config) {
                        form.config.value = text;
                    }
                    if (isWgFile) {
                        setSelectedProtocol('WireGuard');
                    } else if (extStr.endsWith('.ovpn') || text.includes('client')) {
                        setSelectedProtocol('OpenVPN');
                    }
                }
            }
        } catch (error: any) {
            showToast(t('failed_read_config') + ' ' + error.message, 'error');
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

        let safeConfigOpenVPN = '';
        let safeConfigWireGuard = '';

        if (protocol === 'Both') {
            safeConfigOpenVPN = ensureBase64(formData.get('config_openvpn') as string || '');
            safeConfigWireGuard = ensureBase64(formData.get('config_wireguard') as string || '');
        } else if (protocol === 'WireGuard') {
            safeConfigWireGuard = ensureBase64(formData.get('config') as string || '');
        } else {
            safeConfigOpenVPN = ensureBase64(formData.get('config') as string || '');
        }

        const payload: Partial<ServerEntity> = {
            name: formData.get('name') as string,
            region: formData.get('region') as string || '',
            ip: formData.get('ip') as string,
            status: formData.get('status') === 'active' ? 1 : 0,
            onWireGuard: (protocol === 'WireGuard' || protocol === 'Both') ? 1 : 0,
            isVip: formData.get('isVip') ? 1 : 0,
            password: formData.get('password') as string || '',
            config: safeConfigOpenVPN,
            wireGuardConfig: safeConfigWireGuard,
            version: parseInt(formData.get('version') as string, 10) || 1,
            username: formData.get('username') as string || ''
        };

        try {
            await saveServer(editingServer?.id || null, payload);
            showToast(t('save_server') + ' successful', 'success');
            setIsModalOpen(false);
        } catch (error: any) {
            setErrorMsg(error.message || t('failed_save_server'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string | undefined) => {
        if (!id) return;
        if (window.confirm(t('confirm_delete_server'))) {
            setDeletingId(id);
            try {
                await deleteServer(id);
                showToast(t('del') + ' successful', 'success');
            } catch (error: any) {
                showToast(error.message || t('failed_delete_server'), 'error');
            } finally {
                setDeletingId(null);
            }
        }
    };

    const openEdit = (server: ServerEntity) => {
        setEditingServer(server);
        setErrorMsg(null);

        let proto = 'OpenVPN';
        if (server.onWireGuard === 1 && server.config && server.config.trim() !== '') {
            proto = 'Both';
        } else if (server.onWireGuard === 1) {
            proto = 'WireGuard';
        }
        setSelectedProtocol(proto);

        setIsModalOpen(true);
    };

    const openCreate = () => {
        setEditingServer(null);
        setErrorMsg(null);
        setSelectedProtocol('OpenVPN');
        setIsModalOpen(true);
    };

    return (
        <div className="section content-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {selectedIds.length > 0 && (
                        <button className="action-btn delete" onClick={handleBulkDelete} disabled={isDeletingBulk || isLoadingServers} style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', borderRadius: '8px', border: '1px solid currentColor' }}>
                            <Trash2 size={16} /> {isDeletingBulk ? t('deleting') : t('delete_selected', { count: selectedIds.length })}
                        </button>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <input type="file" accept=".json" style={{ display: 'none' }} ref={jsonFileInputRef} onChange={handleImportJSON} />
                    <button className="secondary-btn" onClick={() => jsonFileInputRef.current?.click()} disabled={isLoadingServers}>
                        {t('import_json')}
                    </button>
                    <button className="secondary-btn" onClick={fetchServers} disabled={isLoadingServers}>
                        <RefreshCw size={16} /> {t('refresh')}
                    </button>
                    <button className="primary-btn glow-effect" onClick={openCreate}>
                        <Plus size={16} /> {t('new_server')}
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
                            <th>{t('name')}</th>
                            <th>{t('host_ip')}</th>
                            <th>{t('protocol')}</th>
                            <th>{t('status')}</th>
                            <th>{t('tier')}</th>
                            <th className="text-right">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoadingServers ? (
                            <tr>
                                <td colSpan={7} className="text-center loading-text">{t('loading_servers')}</td>
                            </tr>
                        ) : servers.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center text-muted">{t('no_servers_found')}</td>
                            </tr>
                        ) : (
                            currentServers.map(server => (
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
                                    <td>
                                        {(server.onWireGuard === 1 && server.config && server.config.trim() !== '')
                                            ? t('both_protocol')
                                            : (server.onWireGuard === 1 ? t('wireguard') : t('openvpn'))}
                                    </td>
                                    <td>
                                        <span className={`status-badge ${server.status === 1 ? 'active' : 'offline'}`}>
                                            {server.status === 1 ? t('active') : t('offline')}
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
                                            {server.isVip === 1 ? t('vip') : t('free')}
                                        </span>
                                    </td>
                                    <td className="text-right">
                                        <button className="action-btn edit" onClick={() => openEdit(server)} style={{ marginRight: 8 }} disabled={deletingId === server.id}>
                                            <Edit2 size={14} /> {t('edit')}
                                        </button>
                                        <button className="action-btn delete" onClick={() => handleDelete(server.id)} disabled={deletingId === server.id}>
                                            <Trash2 size={14} /> {deletingId === server.id ? t('deleting') : t('del')}
                                        </button>

                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                {!isLoadingServers && totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', padding: '16px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <button
                            className="secondary-btn"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            style={{ padding: '6px 12px' }}
                        >
                            &laquo; Prev
                        </button>
                        <span style={{ fontSize: '0.9em', color: 'var(--text-light)' }}>
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            className="secondary-btn"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            style={{ padding: '6px 12px' }}
                        >
                            Next &raquo;
                        </button>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content glass-panel">
                        <div className="modal-header">
                            <h3>{editingServer ? t('edit_server') : t('add_new_server')}</h3>
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
                                        <label>{t('server_name')}</label>
                                        <input type="text" name="name" className="glass-input" required defaultValue={editingServer?.name} placeholder={t('eg_us_east_1')} />
                                    </div>
                                    <div className="form-group">
                                        <label>{t('region')}</label>
                                        <input type="text" name="region" className="glass-input" required defaultValue={editingServer?.region || ''} placeholder={t('eg_us_sg')} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>{t('host_ip_domain')}</label>
                                    <input type="text" name="ip" className="glass-input" required defaultValue={editingServer?.ip} placeholder="192.168.1.1" />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>{t('protocol')}</label>
                                        <select
                                            name="protocol"
                                            className="glass-input"
                                            value={selectedProtocol}
                                            onChange={(e) => setSelectedProtocol(e.target.value)}
                                        >
                                            <option value="OpenVPN">{t('openvpn')}</option>
                                            <option value="WireGuard">{t('wireguard')}</option>
                                            <option value="Both">{t('both_protocol')}</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>{t('status')}</label>
                                        <select name="status" className="glass-input" defaultValue={editingServer?.status === 1 ? 'active' : 'offline'}>
                                            <option value="active">{t('active')}</option>
                                            <option value="offline">{t('offline')}</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input type="checkbox" name="isVip" id="serverIsVip" defaultChecked={editingServer?.isVip === 1} style={{ width: 16, height: 16 }} />
                                    <label htmlFor="serverIsVip" style={{ margin: 0, padding: 0 }}>{t('require_vip_sub')}</label>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>{t('username')}</label>
                                        <input type="text" name="username" className="glass-input" defaultValue={editingServer?.username || ''} placeholder={t('eg_vpn')} />
                                    </div>
                                    <div className="form-group">
                                        <label>{t('version')}</label>
                                        <input type="number" name="version" className="glass-input" defaultValue={editingServer?.version || 1} placeholder={t('eg_1')} min="1" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>{t('password_optional')}</label>
                                    <input type="password" name="password" className="glass-input" defaultValue={editingServer?.password || ''} placeholder={t('leave_empty_if_none')} />
                                </div>
                                {selectedProtocol === 'Both' ? (
                                    <>
                                        <input type="file" accept=".ovpn,.conf" style={{ display: 'none' }} ref={configFileInputRef} onChange={handleUploadConfig} />
                                        <div className="form-group">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                <label style={{ margin: 0 }}>{t('openvpn_config')}</label>
                                                <button type="button" className="secondary-btn" style={{ padding: '2px 8px', fontSize: '12px' }} onClick={() => configFileInputRef.current?.click()}>
                                                    {t('upload_file')}
                                                </button>
                                            </div>
                                            <textarea name="config_openvpn" className="glass-input" rows={5} defaultValue={editingServer?.config || ''} placeholder={t('paste_openvpn_config')}></textarea>
                                        </div>
                                        <div className="form-group">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                <label style={{ margin: 0 }}>{t('wireguard_config')}</label>
                                                <button type="button" className="secondary-btn" style={{ padding: '2px 8px', fontSize: '12px' }} onClick={() => configFileInputRef.current?.click()}>
                                                    {t('upload_file')}
                                                </button>
                                            </div>
                                            <textarea name="config_wireguard" className="glass-input" rows={5} defaultValue={editingServer?.wireGuardConfig || ''} placeholder={t('paste_wireguard_config')}></textarea>
                                        </div>
                                    </>
                                ) : (
                                    <div className="form-group">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                            <label style={{ margin: 0 }}>{t('raw_config')}</label>
                                            <input type="file" accept=".ovpn,.conf" style={{ display: 'none' }} ref={configFileInputRef} onChange={handleUploadConfig} />
                                            <button type="button" className="secondary-btn" style={{ padding: '2px 8px', fontSize: '12px' }} onClick={() => configFileInputRef.current?.click()}>
                                                {t('upload_file')}
                                            </button>
                                        </div>
                                        <textarea name="config" className="glass-input" rows={5} defaultValue={selectedProtocol === 'WireGuard' ? (editingServer?.wireGuardConfig || '') : (editingServer?.config || '')} placeholder={selectedProtocol === 'WireGuard' ? t('paste_wireguard_config') : t('paste_openvpn_config')}></textarea>
                                    </div>
                                )}
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="secondary-btn" onClick={() => setIsModalOpen(false)} disabled={isSaving}>{t('cancel')}</button>
                            <button type="submit" form="serverForm" className="primary-btn glow-effect" disabled={isSaving}>
                                {isSaving ? t('saving') : t('save_server')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
