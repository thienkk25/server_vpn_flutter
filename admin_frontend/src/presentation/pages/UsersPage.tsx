import { useEffect, useState } from 'react';
import { useAdminStore } from '../hooks/useAdminStore';
import { Trash2, RefreshCw, Plus, Edit2 } from 'lucide-react';
import type { UserEntity } from '../../domain/entities/admin';

export default function UsersPage() {
    const { users, isLoadingUsers, fetchUsers, deleteUser, saveUser, apiKey } = useAdminStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<Partial<UserEntity> | null>(null);

    useEffect(() => {
        if (apiKey) fetchUsers();
    }, [apiKey, fetchUsers]);

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const payload: Partial<UserEntity> & { password?: string } = {
            email: formData.get('email') as string,
            displayName: formData.get('displayName') as string,
            isPremium: formData.get('isPremium') === 'on',
        };
        
        const password = formData.get('password') as string;
        if (password) {
            payload.password = password;
        }

        await saveUser(editingUser?.uid || null, payload);
        setIsModalOpen(false);
    };

    const handleDelete = async (uid: string) => {
        if (window.confirm('Are you sure you want to delete this user? It will remove them completely.')) {
            await deleteUser(uid);
        }
    };

    const openEdit = (user: UserEntity) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const openCreate = () => {
        setEditingUser(null);
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
                            <th>Premium Status</th>
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
                                    <td>
                                        <span className={`status-badge ${user.isPremium ? 'active' : 'offline'}`}>
                                            {user.isPremium ? 'PREMIUM' : 'FREE'}
                                        </span>
                                    </td>
                                    <td>{new Date(user.creationTime).toLocaleDateString()}</td>
                                    <td className="text-right">
                                        <button className="action-btn edit" onClick={() => openEdit(user)} style={{ marginRight: 8 }}>
                                            <Edit2 size={14} /> Edit
                                        </button>
                                        <button className="action-btn delete" onClick={() => handleDelete(user.uid)}>
                                            <Trash2 size={14} /> Del
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
                                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input type="checkbox" name="isPremium" id="userIsPremium" defaultChecked={editingUser?.isPremium} style={{ width: 16, height: 16 }} />
                                    <label htmlFor="userIsPremium" style={{ margin: 0, padding: 0 }}>Premium Subscription Active</label>
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="secondary-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                            <button type="submit" form="userForm" className="primary-btn glow-effect">{editingUser ? 'Save Changes' : 'Create User'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
