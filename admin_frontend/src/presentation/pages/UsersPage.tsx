import { useEffect } from 'react';
import { useAdminStore } from '../hooks/useAdminStore';
import { Trash2, RefreshCw } from 'lucide-react';

export default function UsersPage() {
    const { users, isLoadingUsers, fetchUsers, deleteUser, apiKey } = useAdminStore();

    useEffect(() => {
        if (apiKey) fetchUsers();
    }, [apiKey, fetchUsers]);

    const handleDelete = async (uid: string) => {
        if (window.confirm('Are you sure you want to delete this user? It will remove them completely.')) {
            await deleteUser(uid);
        }
    };

    return (
        <div className="section content-section">
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '20px' }}>
                <button className="secondary-btn" onClick={fetchUsers} disabled={isLoadingUsers}>
                    <RefreshCw size={16} /> Refresh
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
        </div>
    );
}
