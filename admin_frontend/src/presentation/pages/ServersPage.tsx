import { useEffect, useState, useRef } from 'react';
import { useAdminStore } from '../hooks/useAdminStore';
import { Edit2, Trash2, Plus, RefreshCw, Search, ChevronLeft, ChevronRight, Shield, Activity, X } from 'lucide-react';
import type { ServerEntity } from '../../domain/entities/admin';
import { useTranslation } from 'react-i18next';

export default function ServersPage() {
    const { t } = useTranslation();
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

    const [searchQuery, setSearchQuery] = useState('');
    const [protocolFilter, setProtocolFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const filteredServers = servers.filter(s => {
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            if (!s.name?.toLowerCase().includes(q) &&
                !s.region?.toLowerCase().includes(q) &&
                !s.ip?.toLowerCase().includes(q)) {
                return false;
            }
        }

        if (protocolFilter !== 'all') {
            const hasOvpn = s.config ? true : s.onWireGuard !== 1;
            const hasWg = s.wireGuardConfig ? true : s.onWireGuard === 1;

            if (protocolFilter === 'both' && (!s.config || !s.wireGuardConfig)) return false;
            if (protocolFilter === 'openvpn' && !hasOvpn) return false;
            if (protocolFilter === 'wireguard' && !hasWg) return false;
        }

        if (statusFilter !== 'all') {
            const isActive = s.status === 1;
            if (statusFilter === 'active' && !isActive) return false;
            if (statusFilter === 'offline' && isActive) return false;
        }

        return true;
    });

    const totalPages = Math.ceil(filteredServers.length / itemsPerPage) || 1;
    const validCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (validCurrentPage - 1) * itemsPerPage;
    const paginatedServers = filteredServers.slice(startIndex, startIndex + itemsPerPage);

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [totalPages, currentPage]);

    const toggleSelectAll = () => {
        if (paginatedServers.length === 0) return;

        const paginatedIds = paginatedServers.map(s => s.id).filter(Boolean) as string[];
        const allSelected = paginatedIds.every(id => selectedIds.includes(id));

        if (allSelected) {
            setSelectedIds(prev => prev.filter(id => !paginatedIds.includes(id)));
        } else {
            setSelectedIds(prev => Array.from(new Set([...prev, ...paginatedIds])));
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
        if (window.confirm(t('serversPage.confirmDeleteBulk', { count: selectedIds.length }))) {
            setIsDeletingBulk(true);
            try {
                for (const id of selectedIds) {
                    await deleteServer(id);
                }
                setSelectedIds([]);
            } catch (error: any) {
                alert(error.message || t('serversPage.failedDeleteBulk'));
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

            if (window.confirm(t('serversPage.importConfirm', { count: data.length }))) {
                await importServers(data);
                alert(t('serversPage.importSuccess'));
            }
        } catch (error: any) {
            alert(t('serversPage.importFailed') + ' ' + error.message);
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
            alert(t('serversPage.readFailed') + ' ' + error.message);
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
            setErrorMsg(error.message || t('serversPage.failedSave'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string | undefined) => {
        if (!id) return;
        if (window.confirm(t('serversPage.confirmDelete'))) {
            setDeletingId(id);
            try {
                await deleteServer(id);
            } catch (error: any) {
                alert(error.message || t('serversPage.failedDelete'));
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
                            <Trash2 size={16} /> {isDeletingBulk ? t('serversPage.deleting') : t('serversPage.deleteSelected', { count: selectedIds.length })}
                        </button>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <input type="file" accept=".json" style={{ display: 'none' }} ref={jsonFileInputRef} onChange={handleImportJSON} />
                    <button className="secondary-btn" onClick={() => jsonFileInputRef.current?.click()} disabled={isLoadingServers}>
                        {t('serversPage.importJson')}
                    </button>
                    <button className="secondary-btn" onClick={fetchServers} disabled={isLoadingServers}>
                        <RefreshCw size={16} /> {t('serversPage.refresh')}
                    </button>
                    <button className="primary-btn glow-effect" onClick={openCreate}>
                        <Plus size={16} /> {t('serversPage.newServer')}
                    </button>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(145deg, rgba(20, 24, 36, 0.8) 0%, rgba(15, 17, 26, 0.6) 100%)', border: '1px solid var(--glass-border)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)' }}>
                <div style={{ flex: '1 1 300px', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.05)', transition: 'all 0.3s ease' }} className="search-wrapper">
                        <Search size={18} style={{ color: 'var(--accent-color)' }} />
                        <input
                            type="text"
                            placeholder={t("serversPage.searchPlaceholder")}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ border: 'none', background: 'transparent', color: 'inherit', outline: 'none', width: '100%', fontSize: '0.95rem' }}
                        />
                        {searchQuery && (
                            <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }} onClick={() => setSearchQuery('')}>
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 16px', borderRadius: '12px', background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <Shield size={16} style={{ color: 'var(--text-muted)' }} />
                        <select
                            value={protocolFilter}
                            onChange={(e) => setProtocolFilter(e.target.value)}
                            style={{ border: 'none', background: 'transparent', color: 'var(--text-main)', outline: 'none', padding: '12px 0', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}
                        >
                            <option value="all">{t('serversPage.allProtocols')}</option>
                            <option value="openvpn">{t('serversPage.openvpn')}</option>
                            <option value="wireguard">{t('serversPage.wireguard')}</option>
                            <option value="both">{t('serversPage.bothProtocols')}</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 16px', borderRadius: '12px', background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <Activity size={16} style={{ color: 'var(--text-muted)' }} />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{ border: 'none', background: 'transparent', color: 'var(--text-main)', outline: 'none', padding: '12px 0', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}
                        >
                            <option value="all">{t('serversPage.allStatuses')}</option>
                            <option value="active">{t('serversPage.active')}</option>
                            <option value="offline">{t('serversPage.offline')}</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="table-container glass-panel">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th style={{ width: '40px', textAlign: 'center' }}>
                                <input
                                    type="checkbox"
                                    checked={paginatedServers.length > 0 && paginatedServers.every(s => selectedIds.includes(s.id!))}
                                    onChange={toggleSelectAll}
                                    style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary-color)' }}
                                />
                            </th>
                            <th>{t('serversPage.nameCol')}</th>
                            <th>{t('serversPage.hostCol')}</th>
                            <th>{t('serversPage.protocolCol')}</th>
                            <th>{t('serversPage.statusCol')}</th>
                            <th>{t('serversPage.tier')}</th>
                            <th className="text-right">{t('serversPage.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoadingServers ? (
                            <tr>
                                <td colSpan={7} className="text-center loading-text">{t('serversPage.loading')}</td>
                            </tr>
                        ) : paginatedServers.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center text-muted">{t('serversPage.noMatch')}</td>
                            </tr>
                        ) : (
                            paginatedServers.map(server => (
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
                                    <td>{server.config && server.wireGuardConfig ? t('serversPage.bothProtocols') : server.onWireGuard === 1 ? t('serversPage.wireguard') : t('serversPage.openvpn')}</td>
                                    <td>
                                        <span className={`status-badge ${server.status === 1 ? 'active' : 'offline'}`}>
                                            {server.status === 1 ? t('serversPage.active').toUpperCase() : t('serversPage.offline').toUpperCase()}
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
                                            {server.isVip === 1 ? t('serversPage.vip') : t('serversPage.free')}
                                        </span>
                                    </td>
                                    <td className="text-right">
                                        <button className="action-btn edit" onClick={() => openEdit(server)} style={{ marginRight: 8 }} disabled={deletingId === server.id}>
                                            <Edit2 size={14} /> {t('serversPage.edit')}
                                        </button>
                                        <button className="action-btn delete" onClick={() => handleDelete(server.id)} disabled={deletingId === server.id}>
                                            <Trash2 size={14} /> {deletingId === server.id ? t('serversPage.deleting') : t('serversPage.del')}
                                        </button>

                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {filteredServers.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', padding: '0 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className="text-muted" style={{ fontSize: '14px' }}>
                            {t('serversPage.showing', { start: startIndex + 1, end: Math.min(startIndex + itemsPerPage, filteredServers.length), total: filteredServers.length })}
                        </span>
                        <select
                            className="glass-input"
                            style={{ padding: '4px 8px', width: 'auto', minWidth: '70px', fontSize: '14px' }}
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                            className="secondary-btn"
                            disabled={validCurrentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            style={{ padding: '6px' }}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span style={{ fontSize: '14px', margin: '0 8px' }}>
                            {t('serversPage.page', { current: validCurrentPage, total: totalPages })}
                        </span>
                        <button
                            className="secondary-btn"
                            disabled={validCurrentPage === totalPages}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            style={{ padding: '6px' }}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content glass-panel">
                        <div className="modal-header">
                            <h3>{editingServer ? t('serversPage.editServer') : t('serversPage.addServer')}</h3>
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
                                        <label>{t('serversPage.serverName')}</label>
                                        <input type="text" name="name" className="glass-input" required defaultValue={editingServer?.name} placeholder={t("serversPage.namePlaceholder")} />
                                    </div>
                                    <div className="form-group">
                                        <label>{t('serversPage.region')}</label>
                                        <input type="text" name="region" className="glass-input" required defaultValue={editingServer?.region || ''} placeholder={t("serversPage.regionPlaceholder")} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>{t('serversPage.hostIp')}</label>
                                    <input type="text" name="ip" className="glass-input" required defaultValue={editingServer?.ip} placeholder={t("serversPage.hostPlaceholder")} />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>{t('serversPage.protocol')}</label>
                                        <select name="protocol" className="glass-input" defaultValue={editingServer?.onWireGuard === 1 ? 'WireGuard' : 'OpenVPN'}>
                                            <option value="OpenVPN">OpenVPN</option>
                                            <option value="WireGuard">WireGuard</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>{t('serversPage.status')}</label>
                                        <select name="status" className="glass-input" defaultValue={editingServer?.status === 1 ? 'active' : 'offline'}>
                                            <option value="active">{t('serversPage.active')}</option>
                                            <option value="offline">{t('serversPage.offline')}</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input type="checkbox" name="isVip" id="serverIsVip" defaultChecked={editingServer?.isVip === 1} style={{ width: 16, height: 16 }} />
                                    <label htmlFor="serverIsVip" style={{ margin: 0, padding: 0 }}>{t('serversPage.requireVip')}</label>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>{t('serversPage.username')}</label>
                                        <input type="text" name="username" className="glass-input" defaultValue={editingServer?.username || ''} placeholder={t("serversPage.usernamePlaceholder")} />
                                    </div>
                                    <div className="form-group">
                                        <label>{t('serversPage.version')}</label>
                                        <input type="number" name="version" className="glass-input" defaultValue={editingServer?.version || 1} placeholder={t("serversPage.versionPlaceholder")} min="1" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>{t('serversPage.password')}</label>
                                    <input type="password" name="password" className="glass-input" defaultValue={editingServer?.password || ''} placeholder={t("serversPage.passwordPlaceholder")} />
                                </div>
                                <div className="form-group">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                        <label style={{ margin: 0 }}>{t('serversPage.rawConfig')}</label>
                                        <input type="file" accept=".ovpn,.conf" style={{ display: 'none' }} ref={configFileInputRef} onChange={handleUploadConfig} />
                                        <button type="button" className="secondary-btn" style={{ padding: '2px 8px', fontSize: '12px' }} onClick={() => configFileInputRef.current?.click()}>
                                            {t('serversPage.uploadFile')}
                                        </button>
                                    </div>
                                    <textarea name="config" className="glass-input" rows={5} defaultValue={editingServer?.wireGuardConfig || editingServer?.config || ''} placeholder={t("serversPage.configPlaceholder")}></textarea>
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="secondary-btn" onClick={() => setIsModalOpen(false)} disabled={isSaving}>{t('serversPage.cancel')}</button>
                            <button type="submit" form="serverForm" className="primary-btn glow-effect" disabled={isSaving}>
                                {isSaving ? t('serversPage.saving') : t('serversPage.saveServer')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
