import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock, Mail, MessageSquare, Search, User } from 'lucide-react';
import api from '../../api/axios';

const Tickets = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [actionLoadingId, setActionLoadingId] = useState(null);

    const endpoints = {
        pending: '/chat/support/admin/get-pending-tickets',
        resolved: '/chat/support/admin/get-resolved-tickets',
        resolve: '/chat/support/admin/resolve-ticket',
        pendingFallback: '/chat/chat/support/admin/get-pending-tickets',
        resolvedFallback: '/chat/chat/support/admin/get-resolved-tickets'
    };

    const formatDateTime = (value) => {
        if (!value) return 'Tarix məlum deyil';
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return 'Tarix məlum deyil';
        return parsed.toLocaleString('az-AZ');
    };

    const requestWithFallback = async (primaryPath, fallbackPath) => {
        try {
            return await api.get(primaryPath);
        } catch (error) {
            if (error?.response?.status === 404) {
                return api.get(fallbackPath);
            }
            throw error;
        }
    };

    const fetchTickets = useCallback(async () => {
        setLoading(true);
        try {
            const [pendingResponse, resolvedResponse] = await Promise.all([
                requestWithFallback(endpoints.pending, endpoints.pendingFallback),
                requestWithFallback(endpoints.resolved, endpoints.resolvedFallback)
            ]);

            const pending = (pendingResponse?.data?.data || []).map((item) => ({
                ...item,
                status: item?.status || 'PENDING'
            }));
            const resolved = (resolvedResponse?.data?.data || []).map((item) => ({
                ...item,
                status: item?.status || 'RESOLVED'
            }));

            setTickets([...pending, ...resolved]);
        } catch (error) {
            console.error('Ticketləri yükləyərkən xəta:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    const handleResolve = async (ticket) => {
        const responseText = window.prompt('İstifadəçiyə cavabınızı yazın:');
        if (responseText === null) return;

        const adminResponse = responseText.trim();
        if (!adminResponse) {
            alert('Cavab boş ola bilməz.');
            return;
        }

        try {
            setActionLoadingId(ticket.id);
            await api.post(endpoints.resolve, {
                ticketId: ticket.id,
                adminResponse
            });
            await fetchTickets();
            alert('Ticket cavablandırıldı. İstifadəçiyə chat və email ilə göndərildi.');
        } catch (error) {
            console.error('Ticket cavablandırılarkən xəta:', error);
            alert('Ticket cavablandırıla bilmədi.');
        } finally {
            setActionLoadingId(null);
        }
    };

    const filteredTickets = useMemo(() => {
        return tickets.filter((ticket) => {
            const status = String(ticket.status || '').toUpperCase();
            const isResolved = status === 'RESOLVED';
            const matchFilter =
                filter === 'all' ||
                (filter === 'pending' && !isResolved) ||
                (filter === 'resolved' && isResolved);

            const normalizedSearch = searchTerm.toLowerCase();
            const matchSearch =
                (ticket.title || '').toLowerCase().includes(normalizedSearch) ||
                (ticket.userReport || '').toLowerCase().includes(normalizedSearch) ||
                (ticket.userName || '').toLowerCase().includes(normalizedSearch) ||
                (ticket.userEmail || '').toLowerCase().includes(normalizedSearch);

            return matchFilter && matchSearch;
        });
    }, [tickets, filter, searchTerm]);

    if (loading) {
        return <div className="loading-state">Ticketlər yüklənir...</div>;
    }

    return (
        <div className="messages-container">
            <header className="page-header">
                <div>
                    <h1>Support Tickets</h1>
                    <p>İstifadəçi müraciətlərini idarə edin və cavablandırın</p>
                </div>
                <div className="header-actions">
                    <div className="search-bar">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Ticket axtar..."
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                        />
                    </div>
                </div>
            </header>

            <div className="filter-tabs">
                <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>Hamısı</button>
                <button className={filter === 'pending' ? 'active' : ''} onClick={() => setFilter('pending')}>Pending</button>
                <button className={filter === 'resolved' ? 'active' : ''} onClick={() => setFilter('resolved')}>Resolved</button>
            </div>

            <div className="reports-grid">
                {filteredTickets.length === 0 ? (
                    <div className="empty-state glass">
                        <MessageSquare size={48} color="var(--accent)" />
                        <h3>Ticket tapılmadı</h3>
                        <p>Filter və axtarışa uyğun nəticə yoxdur.</p>
                    </div>
                ) : (
                    filteredTickets.map((ticket) => {
                        const status = String(ticket.status || '').toUpperCase();
                        const isResolved = status === 'RESOLVED';

                        return (
                            <div key={ticket.id} className="report-card glass animate-fade-in">
                                <div className="report-header">
                                    <div className="reporter-info">
                                        {isResolved ? <CheckCircle2 size={20} color="#16a34a" /> : <Clock size={20} color="#f97316" />}
                                        <span>{isResolved ? 'Resolved' : 'Pending'} ticket</span>
                                    </div>
                                    <span className={`status-badge ${isResolved ? 'resolved' : 'pending'}`}>
                                        {isResolved ? 'Resolved' : 'Pending'}
                                    </span>
                                </div>

                                <div className="report-content">
                                    <div className="message-preview">
                                        <p className="label">Mövzu</p>
                                        <p className="msg-text">{ticket.title || '-'}</p>
                                    </div>

                                    <div className="message-preview" style={{ marginTop: '10px' }}>
                                        <p className="label">İstifadəçi müraciəti</p>
                                        <p className="msg-text" style={{ whiteSpace: 'pre-wrap' }}>{ticket.userReport || '-'}</p>
                                    </div>

                                    {ticket.adminResponse && (
                                        <div className="message-preview" style={{ marginTop: '10px' }}>
                                            <p className="label">Admin cavabı</p>
                                            <p className="msg-text" style={{ whiteSpace: 'pre-wrap' }}>{ticket.adminResponse}</p>
                                        </div>
                                    )}

                                    <div className="user-details">
                                        <div className="detail">
                                            <User size={16} />
                                            <span>User: <strong>{ticket.userName || 'Unknown'}</strong></span>
                                        </div>
                                        <div className="detail">
                                            <Mail size={16} />
                                            <span>Email: <strong>{ticket.userEmail || 'Unknown'}</strong></span>
                                        </div>
                                        <div className="detail">
                                            <Clock size={16} />
                                            <span>Report time: {formatDateTime(ticket.reportTime)}</span>
                                        </div>
                                        {ticket.responseTime && (
                                            <div className="detail">
                                                <CheckCircle2 size={16} />
                                                <span>Response time: {formatDateTime(ticket.responseTime)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="report-actions">
                                    {!isResolved && (
                                        <button
                                            className="btn-resolve"
                                            onClick={() => handleResolve(ticket)}
                                            disabled={actionLoadingId === ticket.id}
                                        >
                                            <CheckCircle2 size={18} />
                                            Cavablandır
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default Tickets;
