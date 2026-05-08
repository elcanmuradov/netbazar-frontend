import React, { useState, useEffect } from 'react';
import { User, Search, Ban, ShieldCheck, Phone, Calendar } from 'lucide-react';
import { useToast } from '../../components/Toast/ToastContext';
import api from '../../api/axios';
import './Users.css';

const Users = () => {
    const toast = useToast();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchUsers = async () => {
        try {
            const response = await api.get('/admin/users');
            setUsers(response.data.data || []);
        } catch (error) {
            console.error("Error fetching users", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleBanUser = async (userId) => {
        const days = window.prompt('Ban müddətini günlərlə daxil edin:', '1');
        if (days === null) return;
        const dayCount = parseInt(days);
        if (isNaN(dayCount) || dayCount <= 0) {
            toast.warning('Düzgün gün sayı daxil edin');
            return;
        }
        const seconds = dayCount * 24 * 60 * 60;
        try {
            await api.put(`/admin/users/${userId}/ban?seconds=${seconds}`);
            toast.success('İstifadəçi uğurla banlandı');
            fetchUsers();
        } catch (error) {
            console.error("Error banning user", error);
            toast.error('İstifadəçini banlamaq mümkün olmadı');
        }
    };

    const handleUnBanUser = async (userId) => {
        if (!window.confirm("İstifadəçinin banını götürmək istədiyinizə əminsiniz?")) return;
        try {
            await api.put(`/admin/users/${userId}/unban`);
            toast.success('İstifadəçinin banı götürüldü');
            fetchUsers();
        } catch (error) {
            console.error("Error unbanning user", error);
            toast.error('İstifadəçinin banını götürmək mümkün olmadı');
        }
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="loading-state">Loading user directory...</div>;

    return (
        <div className="admin-users-container">
            <header className="page-header">
                <div>
                    <h1>User Directory</h1>
                    <p>Monitor and manage all registered accounts on Swaply</p>
                </div>
                <div className="header-actions">
                    <div className="search-bar">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, email or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            <div className="user-table-wrapper glass">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>User Profile</th>
                            <th>Status</th>
                            <th>Role</th>
                            <th>Contact</th>
                            <th>Joined Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="empty-table-row">No users found.</td>
                            </tr>
                        ) : (
                            filteredUsers.map((u, index) => (
                                <tr key={u.id || index} className="table-row animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                                    <td className="u-info-td">
                                        <div className="u-cell-content">
                                            <div className="u-avatar">
                                                {u.name?.charAt(0).toUpperCase() || <User size={20} />}
                                            </div>
                                            <div className="u-text">
                                                <strong className="u-name">{u.name}</strong>
                                                <span className="u-email">{u.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge-status ${u.status?.toLowerCase() || 'active'}`}>
                                            {u.status || 'ACTIVE'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="role-cell">
                                            {u.userRole || 'USER'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="phone-cell">
                                            <Phone size={14} style={{ marginRight: '6px' }} />
                                            {u.phone || 'N/A'}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="date-cell" style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                                            <Calendar size={14} style={{ marginRight: '6px' }} />
                                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString('az-AZ') : 'N/A'}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="action-cell">
                                            {u.status === 'BANNED' ? (
                                                <button 
                                                    className="action-btn-toggle success" 
                                                    onClick={() => handleUnBanUser(u.id)}
                                                    title="Banı aç"
                                                >
                                                    <ShieldCheck size={16} />
                                                    <span>Banı aç</span>
                                                </button>
                                            ) : (
                                                <button 
                                                    className="action-btn-toggle danger" 
                                                    onClick={() => handleBanUser(u.id)}
                                                    title="Banla"
                                                >
                                                    <Ban size={16} />
                                                    <span>Banla</span>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Users;
