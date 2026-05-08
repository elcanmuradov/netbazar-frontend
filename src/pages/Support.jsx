import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, MessageSquare, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';

const supportDateFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Baku',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
});

const Support = () => {
    const navigate = useNavigate();
    const { user, token, loading: authLoading } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        title: '',
        description: ''
    });
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(null);

    const supportEndpoints = {
        create: '/chat/support/create-ticket',
        myTickets: '/chat/support/my-tickets',
        createFallback: '/chat/chat/support/create-ticket',
        myTicketsFallback: '/chat/chat/support/my-tickets'
    };

    useEffect(() => {
        if (!authLoading && (!user || !token)) {
            navigate('/login');
        }
    }, [authLoading, user, token, navigate]);

    // Fetch user's tickets
    useEffect(() => {
        if (!authLoading && user && token) {
            fetchUserTickets();
        }
    }, [authLoading, user, token]);

    // Auto-dismiss toast
    useEffect(() => {
        if (!toast) return;
        const timer = window.setTimeout(() => setToast(null), 3000);
        return () => window.clearTimeout(timer);
    }, [toast]);

    const normalizeTickets = (response) => {
        const payload = response?.data?.data ?? response?.data;
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.content)) return payload.content;
        return [];
    };

    const formatDateTime = (value) => {
        if (!value) return 'Tarix məlumatı yoxdur';
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return 'Tarix məlumatı yoxdur';

        const parts = supportDateFormatter.formatToParts(parsed);
        const day = parts.find((part) => part.type === 'day')?.value;
        const month = parts.find((part) => part.type === 'month')?.value;
        const year = parts.find((part) => part.type === 'year')?.value;
        const hour = parts.find((part) => part.type === 'hour')?.value;
        const minute = parts.find((part) => part.type === 'minute')?.value;

        if (!day || !month || !year || !hour || !minute) return 'Tarix məlumatı yoxdur';
        return `${day}/${month}/${year}  -  ${hour}:${minute}`;
    };

    const buildSupportRequestConfig = () => ({
        headers: {
            'X-User-Id': user?.id
        }
    });

    if (authLoading) {
        return (
            <div className="container" style={{ padding: '5rem 20px', display: 'flex', justifyContent: 'center' }}>
                <div className="loader">Yüklənir...</div>
            </div>
        );
    }

    const fetchUserTickets = async () => {
        try {
            setLoading(true);
            let response;
            try {
                response = await api.get(supportEndpoints.myTickets, buildSupportRequestConfig());
            } catch (error) {
                const status = error?.response?.status;
                if (status === 404) {
                    response = await api.get(supportEndpoints.myTicketsFallback, buildSupportRequestConfig());
                } else {
                    throw error;
                }
            }
            setTickets(normalizeTickets(response));
        } catch (error) {
            console.error('Biletləri yükləyərkən xəta:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title.trim() || !formData.description.trim()) {
            setToast({
                type: 'error',
                message: 'Lütfən mövzu və məsələni doldurun.'
            });
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                userId: user?.id,
                title: formData.title,
                userReport: formData.description
            };

            try {
                await api.post(supportEndpoints.create, payload, buildSupportRequestConfig());
            } catch (error) {
                const status = error?.response?.status;
                if (status === 404) {
                    await api.post(supportEndpoints.createFallback, payload, buildSupportRequestConfig());
                } else {
                    throw error;
                }
            }

            setToast({
                type: 'success',
                message: 'Müraciətiniz göndərildi. Tezliklə cavab alacaqsınız.'
            });

            setFormData({ title: '', description: '' });
            await fetchUserTickets(); // Refresh tickets list
        } catch (error) {
            console.error('Müraciət göndərilərkən xəta:', error);
            setToast({
                type: 'error',
                message: error.response?.data?.message || 'Müraciət göndərilə bilmədi.'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusIcon = (ticket) => {
        if (ticket.adminResponse) {
            return <CheckCircle size={20} className="status-icon answered" title="Cavablandırılıb" />;
        }
        return <Clock size={20} className="status-icon pending" title="Gözləmədə" />;
    };

    const getStatusText = (ticket) => {
        if (ticket.adminResponse) {
            return 'Cavablandırılıb';
        }
        return 'Gözləmədə';
    };

    return (
        <div className="container support-page" style={{ padding: '3rem 20px', maxWidth: '1000px' }}>
            {toast && (
                <div className={`support-toast ${toast.type}`}>{toast.message}</div>
            )}

            {/* Header */}
            <motion.div
                className="support-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                    <MessageSquare size={32} color="var(--primary)" />
                    <h1>Dəstək mərkəzi</h1>
                </div>
                <p>Sifariş, çatdırılma, qaytarma və hesabla bağlı suallarınızı bizə yazın. Komandamız tezliklə cavab verəcək.</p>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem', marginTop: '2rem' }}>
                {/* Form Section */}
                <motion.div
                    className="support-form-section glass"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <h2 style={{ marginBottom: '1.5rem', fontSize: '1.3rem', fontWeight: 700 }}>Yeni müraciət</h2>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="title">Mövzu *</label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                placeholder="Müraciətinizin mövzusu"
                                maxLength="100"
                                disabled={submitting}
                            />
                            <small style={{ color: 'var(--text-light)', marginTop: '0.3rem' }}>
                                {formData.title.length}/100
                            </small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="description">Məsələ təsviri *</label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Problemi və ya sualı ətraflı yazın..."
                                rows="8"
                                maxLength="2000"
                                disabled={submitting}
                                style={{ resize: 'vertical' }}
                            />
                            <small style={{ color: 'var(--text-light)', marginTop: '0.3rem' }}>
                                {formData.description.length}/2000
                            </small>
                        </div>

                        <button
                            type="submit"
                            className="btn-primary submit-btn"
                            disabled={submitting}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                            <Send size={18} />
                            <span>{submitting ? 'Göndərilir...' : 'Göndər'}</span>
                        </button>
                    </form>
                </motion.div>

                {/* Tickets History */}
                <motion.div
                    className="support-tickets-section"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <h2 style={{ marginBottom: '1.5rem', fontSize: '1.3rem', fontWeight: 700 }}>Müraciət tarixçəsi</h2>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
                            Yüklənir...
                        </div>
                    ) : tickets.length === 0 ? (
                        <div className="empty-state glass" style={{ padding: '2rem', textAlign: 'center' }}>
                            <AlertCircle size={48} style={{ color: 'var(--text-light)', marginBottom: '1rem', opacity: 0.5 }} />
                            <p style={{ color: 'var(--text-light)' }}>Hələ müraciət yoxdur</p>
                        </div>
                    ) : (
                        <div className="tickets-list">
                            {tickets.map((ticket, idx) => (
                                <motion.div
                                    key={ticket.id || idx}
                                    className="ticket-card glass"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 * idx }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{ margin: '0 0 0.3rem 0', fontSize: '1rem', fontWeight: 700 }}>
                                                {ticket.title}
                                            </h3>
                                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-light)' }}>
                                                {formatDateTime(ticket.reportTime)}
                                            </p>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {getStatusIcon(ticket)}
                                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: ticket.adminResponse ? '#0f766e' : '#d97706' }}>
                                                {getStatusText(ticket)}
                                            </span>
                                        </div>
                                    </div>

                                    <p style={{ margin: '0.75rem 0', padding: '0.75rem', backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--text)' }}>
                                        {ticket.userReport}
                                    </p>

                                    {ticket.adminResponse && (
                                        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#ecfdf3', borderLeft: '3px solid #0f766e', borderRadius: '6px' }}>
                                            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', fontWeight: 700, color: '#0f766e', textTransform: 'uppercase' }}>
                                                Admin Cavabı
                                            </p>
                                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#166534', whiteSpace: 'pre-wrap' }}>
                                                {ticket.adminResponse}
                                            </p>
                                            {ticket.responseTime && (
                                                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#0f766e', opacity: 0.7 }}>
                                                    {formatDateTime(ticket.responseTime)}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>

            <style>{`
                .support-page {
                    min-height: calc(100vh - 200px);
                    font-family: 'Segoe UI', 'Noto Sans', 'DejaVu Sans', Arial, sans-serif;
                }

                .support-header {
                    text-align: center;
                    margin-bottom: 2rem;
                }

                .support-header h1 {
                    font-size: 2.5rem;
                    font-weight: 800;
                    color: var(--dark);
                    margin: 0;
                }

                .support-header p {
                    font-size: 1rem;
                    color: var(--text-light);
                    margin: 0;
                }

                .support-form-section,
                .support-tickets-section {
                    padding: 2rem;
                    border-radius: 16px;
                    border: 1px solid var(--border);
                }

                .form-group {
                    margin-bottom: 1.5rem;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 600;
                    color: var(--dark);
                    font-size: 0.9rem;
                }

                .form-group input,
                .form-group textarea {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    border: 1px solid var(--border);
                    border-radius: 8px;
                    font-size: 0.95rem;
                    font-family: inherit;
                    transition: all 0.2s ease;
                    background: white;
                }

                .form-group input:focus,
                .form-group textarea:focus {
                    outline: none;
                    border-color: var(--primary);
                    background: #f9fafb;
                }

                .form-group textarea {
                    font-size: 0.9rem;
                    line-height: 1.5;
                }

                .submit-btn {
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-weight: 700;
                    font-size: 0.95rem;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .submit-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .support-toast {
                    position: fixed;
                    top: 22px;
                    right: 22px;
                    z-index: 1200;
                    border-radius: 12px;
                    padding: 12px 16px;
                    font-size: 0.9rem;
                    font-weight: 700;
                    max-width: min(92vw, 400px);
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
                    animation: slideToastIn 0.25s ease;
                }

                .support-toast.success {
                    background: #ecfdf3;
                    border: 1px solid #86efac;
                    color: #166534;
                }

                .support-toast.error {
                    background: #fef2f2;
                    border: 1px solid #fca5a5;
                    color: #991b1b;
                }

                @keyframes slideToastIn {
                    from {
                        opacity: 0;
                        transform: translateY(-8px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .empty-state {
                    border: 1px dashed var(--border);
                    border-radius: 12px;
                }

                .tickets-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    max-height: 600px;
                    overflow-y: auto;
                }

                .ticket-card {
                    padding: 1.25rem;
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    transition: all 0.2s ease;
                }

                .ticket-card:hover {
                    border-color: var(--primary);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                }

                .status-icon {
                    flex-shrink: 0;
                }

                .status-icon.answered {
                    color: #0f766e;
                }

                .status-icon.pending {
                    color: #d97706;
                }

                @media (max-width: 768px) {
                    .support-header h1 {
                        font-size: 1.8rem;
                    }

                    div[style*="grid-template-columns: 1fr 1.2fr"] {
                        grid-template-columns: 1fr;
                    }

                    .support-form-section,
                    .support-tickets-section {
                        padding: 1.5rem;
                    }

                    .tickets-list {
                        max-height: 400px;
                    }
                }
            `}</style>
        </div>
    );
};

export default Support;
