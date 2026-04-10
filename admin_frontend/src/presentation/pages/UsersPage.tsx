import { useEffect, useState } from 'react';
import { useAdminStore } from '../hooks/useAdminStore';
import { Trash2, RefreshCw, Plus, Edit2 } from 'lucide-react';
import type { UserEntity } from '../../domain/entities/admin';
import { useTranslation } from 'react-i18next';

export default function UsersPage() {
    const { t } = useTranslation();
    const { users, isLoadingUsers, fetchUsers, deleteUser, saveUser, apiKey } = useAdminStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<Partial<UserEntity> | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        if (apiKey) fetchUsers();
    }, [apiKey, fetchUsers]);

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMsg(null);
        setIsSaving(true);
        const formData = new FormData(e.currentTarget);
        const payload: Partial<UserEntity> & { password?: string } = {
            email: formData.get('email') as string,
            displayName: formData.get('displayName') as string,
        };
        
        const password = formData.get('password') as string;
        if (password) {
            payload.password = password;
        }

        try {
            await saveUser(editingUser?.uid || null, payload);
            setIsModalOpen(false);
        } catch (error: any) {
            setErrorMsg(error.message || t('failed_save_user'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (uid: string) => {
        if (window.confirm(t('confirm_delete_user'))) {
            setDeletingId(uid);
            try {
                await deleteUser(uid);
            } catch (error: any) {
                alert(error.message || t('failed_delete_user'));
            } finally {
                setDeletingId(null);
            }
        }
    };

    const openEdit = (user: UserEntity) => {
        setEditingUser(user);
        setErrorMsg(null);
        setIsModalOpen(true);
    };

    const openCreate = () => {
        setEditingUser(null);
        setErrorMsg(null);
        setIsModalOpen(true);
    };

    return (
        <div className="section content-section">
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '20px' }}>
                <button className="secondary-btn" onClick={fetchUsers} disabled={isLoadingUsers}>
                    <RefreshCw size={16} /> {t('refresh')}
                </button>
                <button className="primary-btn glow-effect" onClick={openCreate}>
                    <Plus size={16} /> {t('new_user')}
                </button>
            </div>

            <div className="table-container glass-panel">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>{t('uid')}</th>
                            <th>{t('email')}</th>
                            <th>{t('display_name')}</th>

                            <th>{t('joined_at')}</th>
                            <th className="text-right">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoadingUsers ? (
                            <tr>
                                <td colSpan={6} className="text-center loading-text">{t('loading_users')}</td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center text-muted">{t('no_users_found')}</td>
                            </tr>
                        ) : (
                            users.map(user => (
                                <tr key={user.uid}>
                                    <td><small style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{user.uid}</small></td>
                                    <td><strong>{user.email}</strong></td>
                                    <td>{user.displayName}</td>

                                    <td>{new Date(user.creationTime).toLocaleDateString()}</td>
                                    <td className="text-right">
                                        <button className="action-btn edit" onClick={() => openEdit(user)} style={{ marginRight: 8 }} disabled={deletingId === user.uid}>
                                            <Edit2 size={14} /> {t('edit')}
                                        </button>
                                        <button className="action-btn delete" onClick={() => handleDelete(user.uid)} disabled={deletingId === user.uid}>
                                            <Trash2 size={14} /> {deletingId === user.uid ? t('deleting') : t('del')}
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
                            <h3>{editingUser ? t('edit_user') : t('add_new_user')}</h3>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            {errorMsg && (
                                <div style={{ padding: '10px', backgroundColor: 'rgba(255, 59, 48, 0.1)', color: '#ff3b30', border: '1px solid currentColor', borderRadius: '8px', marginBottom: '16px' }}>
                                    {errorMsg}
                                </div>
                            )}
                            <form id="userForm" onSubmit={handleSave}>
                                <div className="form-group">
                                    <label>{t('email')}</label>
                                    <input type="email" name="email" className="glass-input" required defaultValue={editingUser?.email} placeholder="user@example.com" />
                                </div>
                                <div className="form-group">
                                    <label>{t('display_name')}</label>
                                    <input type="text" name="displayName" className="glass-input" defaultValue={editingUser?.displayName} placeholder="John Doe" />
                                </div>
                                <div className="form-group">
                                    <label>{t('password_optional')} {editingUser && t('leave_blank_keep_current')}</label>
                                    <input type="password" name="password" className="glass-input" required={!editingUser} placeholder={t('enter_password')} />
                                </div>

                            </form>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="secondary-btn" onClick={() => setIsModalOpen(false)} disabled={isSaving}>{t('cancel')}</button>
                            <button type="submit" form="userForm" className="primary-btn glow-effect" disabled={isSaving}>
                                {isSaving ? t('saving') : (editingUser ? t('save_changes') : t('create_user'))}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
