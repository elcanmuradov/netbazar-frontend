import React, { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, Ban, CheckCircle2, AlertTriangle, User, Search, Trash2, X } from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../components/Toast/ToastContext';

const Messages = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteReason, setDeleteReason] = useState('');

    const fetchMessages = useCallback(async () => {
        setLoading(true);

        try {
            const response = await api.get('/admin/reported-messages');
            setMessages(response.data.data || []);
        } catch (error) {
            console.error("Error fetching reported messages", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    const handleBanUser = async (message) => {
        const days = window.prompt('Ban müddətini günlərlə daxil edin:', '1');
        if (days === null) return;

        const dayCount = parseInt(days);
        if (isNaN(dayCount) || dayCount <= 0) {
            toast.error('Zəhmət olmasa düzgün gün sayı daxil edin.');
            return;
        }

        const seconds = dayCount * 24 * 60 * 60;

        try {
            setActionLoadingId(message.id);
            await api.put(`/admin/users/${message.senderId}/ban?seconds=${seconds}`);
            await api.put(`/admin/reported-messages/${message.id}/ban`);
            await api.put(`/admin/reported-messages/${message.id}/resolve`);
            
            toast.success('İstifadəçi banlandı və məruzə həll olundu.');
            await fetchMessages();
        } catch (error) {
            console.error("Error in ban-resolve process", error);
            toast.error('Əməliyyat zamanı xəta baş verdi.');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleResolve = async (message) => {
        try {
            setActionLoadingId(message.id);
            await api.put(`/admin/reported-messages/${message.id}/resolve`);
            toast.success('Məruzə həll olundu.');
            await fetchMessages();
        } catch (error) {
            console.error("Error resolving message", error);
            toast.error('Xəta baş verdi.');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleOpenDeleteModal = (message) => {
        setDeleteTarget(message);
        setDeleteReason('');
    };

    const handleCloseDeleteModal = () => {
        setDeleteTarget(null);
        setDeleteReason('');
    };

    const handleDeleteMessage = async () => {
        if (!deleteTarget) return;

        const trimmedReason = deleteReason.trim();
        if (!trimmedReason) {
            toast.error('Silme səbəbi yazılmalıdır.');
            return;
        }

        try {
            setActionLoadingId(deleteTarget.id);
            await api.delete(`/admin/reported-messages/${deleteTarget.id}`, {
                data: {
                    reason: trimmedReason,
                },
            });
            toast.success('Mesaj silindi. Silme səbəbi backendə ötürüldü.');
            handleCloseDeleteModal();
            await fetchMessages();
        } catch (error) {
            console.error("Error deleting reported message", error);
            toast.error('Mesajı silmək mümkün olmadı.');
        } finally {
            setActionLoadingId(null);
        }
    };

    const filteredMessages = messages.filter(msg => {
        const isResolved = msg.status === 'RESOLVED';
        const matchesFilter = filter === 'all' ||
            (filter === 'pending' && !isResolved) ||
            (filter === 'resolved' && isResolved);

        const contentMatch = msg.content?.toLowerCase().includes(searchTerm.toLowerCase());
        const senderMatch = msg.senderId?.toString().toLowerCase().includes(searchTerm.toLowerCase());

        return matchesFilter && (contentMatch || senderMatch);
    });

    if (loading) return <div className="loading-state">Loading reports...</div>;

    return (
        <div className="messages-container">
            <header className="page-header">
                <div>
                    <h1>Reported Messages</h1>
                    <p>Review and moderate user communications</p>
                </div>
                <div className="header-actions">
                    <div className="search-bar">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search reports..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            <div className="filter-tabs">
                <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All Reports</button>
                <button className={filter === 'pending' ? 'active' : ''} onClick={() => setFilter('pending')}>Pending</button>
                <button className={filter === 'resolved' ? 'active' : ''} onClick={() => setFilter('resolved')}>Resolved</button>
            </div>

            <div className="reports-grid">
                {filteredMessages.length === 0 ? (
                    <div className="empty-state glass">
                        <CheckCircle2 size={48} color="var(--accent)" />
                        <h3>All Clear!</h3>
                        <p>No reported messages matching your criteria.</p>
                    </div>
                ) : (
                    filteredMessages.map((msg, index) => (
                        <div key={msg.id || index} className="report-card glass animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                            <div className="report-header">
                                <div className="reporter-info">
                                    <AlertTriangle size={20} color="#f97316" />
                                    <span>Reported by <strong>{msg.reporterName || 'Anonymous'}</strong></span>
                                </div>
                                <span className={`status-badge ${msg.status?.toLowerCase() || 'pending'}`}>
                                    {msg.status || 'Pending'}
                                </span>
                            </div>

                            <div className="report-content">
                                <div className="message-preview">
                                    <p className="label">Message Content</p>
                                    <p className="msg-text">"{msg.content}"</p>
                                </div>

                                <div className="user-details">
                                    <div className="detail">
                                        <User size={16} />
                                        <span>Sender: <strong>{msg.user || 'Unknown'}</strong></span>
                                    </div>
                                    <div className="detail">
                                        <ShieldAlert size={16} />
                                        <span>Sent at: {msg.sentAt ? new Date(msg.sentAt).toLocaleString('az-AZ') : 'Unknown'}</span>
                                    </div>
                                    <div className="detail">
                                        <AlertTriangle size={16} />
                                        <span>Reported at: {msg.reportedAt ? new Date(msg.reportedAt).toLocaleString('az-AZ') : 'Unknown'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="report-actions">
                                <button className="btn-ban" onClick={() => handleBanUser(msg)} disabled={actionLoadingId === msg.id}>
                                    <Ban size={18} />
                                    Ban User
                                </button>
                                <button className="btn-resolve" onClick={() => handleResolve(msg)} disabled={actionLoadingId === msg.id}>
                                    <CheckCircle2 size={18} />
                                    Mark Resolved
                                </button>
                                <button className="btn-delete" onClick={() => handleOpenDeleteModal(msg)} disabled={actionLoadingId === msg.id}>
                                    <Trash2 size={18} />
                                    Delete Message
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {deleteTarget && (
                <div className="modal-overlay" role="presentation" onClick={handleCloseDeleteModal}>
                    <div className="delete-modal glass" role="dialog" aria-modal="true" aria-labelledby="delete-message-title" onClick={(event) => event.stopPropagation()}>
                        <div className="delete-modal-header">
                            <div>
                                <p className="modal-eyebrow">Message removal</p>
                                <h3 id="delete-message-title">Delete reported message</h3>
                            </div>
                            <button className="modal-close-btn" onClick={handleCloseDeleteModal} aria-label="Close delete dialog">
                                <X size={18} />
                            </button>
                        </div>

                        <p className="modal-copy">
                            Enter the deletion reason. The backend can use this text for the user notification in mail and chat.
                        </p>

                        <label className="modal-label" htmlFor="delete-reason">Deletion reason</label>
                        <textarea
                            id="delete-reason"
                            className="reason-textarea"
                            rows="4"
                            placeholder="Write why this message is being deleted..."
                            value={deleteReason}
                            onChange={(event) => setDeleteReason(event.target.value)}
                        />

                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={handleCloseDeleteModal}>
                                Cancel
                            </button>
                            <button className="btn-danger" onClick={handleDeleteMessage}>
                                <Trash2 size={18} />
                                Delete and notify
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Messages;
