import { useEffect, useState } from 'react';
import { useAdminStore } from '../hooks/useAdminStore';
import { Trash2, RefreshCw, Plus, Edit2 } from 'lucide-react';
import type { UserEntity } from '../../domain/entities/admin';

export default function UsersPage() {
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
            setErrorMsg(error.message || 'Failed to save user');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (uid: string) => {
        if (window.confirm('Are you sure you want to delete this user? It will remove them completely.')) {
            setDeletingId(uid);
            try {
                await deleteUser(uid);
            } catch (error: any) {
                alert(error.message || 'Failed to delete user');
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
                    <RefreshCw size={16} /> Refresh
                </button>
                <button className="primary-btn glow-effect" onClick={openCreate}>
                    <Plus size={16} /> New User
                </button>
            </div>

            <div className="table-container glass-panel">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>UID</th>
                            <th>Email</th>
                            <th>Display Name</th>

                            <th>Joined At</th>
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoadingUsers ? (
                            <tr>
                                <td colSpan={6} className="text-center loading-text">Loading users...</td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center text-muted">No users found.</td>
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
                                            <Edit2 size={14} /> Edit
                                        </button>
                                        <button className="action-btn delete" onClick={() => handleDelete(user.uid)} disabled={deletingId === user.uid}>
                                            <Trash2 size={14} /> {deletingId === user.uid ? 'Deleting...' : 'Del'}
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
                            <h3>{editingUser ? 'Edit User' : 'Add New User'}</h3>
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
                                    <label>Email</label>
                                    <input type="email" name="email" className="glass-input" required defaultValue={editingUser?.email} placeholder="user@example.com" />
                                </div>
                                <div className="form-group">
                                    <label>Display Name</label>
                                    <input type="text" name="displayName" className="glass-input" defaultValue={editingUser?.displayName} placeholder="John Doe" />
                                </div>
                                <div className="form-group">
                                    <label>Password {editingUser && '(Leave blank to keep current)'}</label>
                                    <input type="password" name="password" className="glass-input" required={!editingUser} placeholder="Enter password" />
                                </div>

                            </form>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="secondary-btn" onClick={() => setIsModalOpen(false)} disabled={isSaving}>Cancel</button>
                            <button type="submit" form="userForm" className="primary-btn glow-effect" disabled={isSaving}>
                                {isSaving ? 'Saving...' : (editingUser ? 'Save Changes' : 'Create User')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
