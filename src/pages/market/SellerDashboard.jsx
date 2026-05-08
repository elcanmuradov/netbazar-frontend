import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Package, ShoppingBag, Truck, CreditCard, Bell, X, ArrowRight, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';
import api from '../../api/axios';
import './SellerDashboard.css';

const StatCard = ({ label, value, icon: Icon, color }) => (
    <div className="seller-stat-card glass">
        <div className={`seller-stat-icon ${color}`}>
            <Icon size={22} />
        </div>
        <div className="seller-stat-body">
            <p className="seller-stat-label">{label}</p>
            <h2 className="seller-stat-value">{value}</h2>
        </div>
    </div>
);

const SellerDashboard = () => {
    const { user, token, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [recentOrders, setRecentOrders] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        if (!user?.id) return;
        try {
            const res = await api.get(`/seller/dashboard/${user.id}`);
            const data = res.data?.data;
            if (data) {
                setStats(data.stats);
                setRecentOrders((data.orders || []).slice(0, 5));
            }
        } catch (e) {
            console.error('Dashboard fetch error', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [user?.id]);

    // WebSocket for real-time notifications
    useEffect(() => {
        if (!token || !user) return;
        const socket = new SockJS('/api/chat/ws');
        const client = new Client({
            webSocketFactory: () => socket,
            connectHeaders: { Authorization: `Bearer ${token}` },
            onConnect: () => {
                client.subscribe('/user/queue/notifications', (msg) => {
                    const payload = JSON.parse(msg.body);
                    if (payload.type === 'NEW_ORDER') {
                        setNotifications(prev => [{ id: Date.now(), message: payload.message, time: new Date().toLocaleTimeString() }, ...prev]);
                        fetchData();
                    }
                });
            },
        });
        client.activate();
        return () => client.deactivate();
    }, [token, user?.id]);

    const statCards = stats ? [
        { label: 'Aktiv məhsul',     value: stats.activeProducts  ?? 0, icon: Package,     color: 'green'  },
        { label: 'Gündəlik sifariş', value: stats.dailyOrders     ?? 0, icon: ShoppingBag, color: 'blue'   },
        { label: 'Hazırlanır',       value: stats.ordersInProgress ?? 0, icon: Truck,       color: 'orange' },
        { label: 'Bu günkü gəlir',   value: `₼${parseFloat(stats.revenueToday || 0).toFixed(2)}`, icon: CreditCard, color: 'purple' },
    ] : [];

    const statusLabel = (s) => ({
        RECEIVED: 'Qəbul edildi', PREPARING: 'Hazırlanır',
        SHIPPING: 'Yoldadır', DELIVERED: 'Çatdırılıb', CANCELLED: 'Ləğv edildi'
    }[s] || s);

    if (loading) return <div className="seller-loading">Yüklənir...</div>;

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="seller-page">
            {/* Notifications */}
            {notifications.length > 0 && (
                <div className="seller-notifications">
                    {notifications.map(n => (
                        <motion.div key={n.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="seller-notif glass">
                            <Bell size={18} color="var(--accent)" />
                            <div className="seller-notif-text">
                                <span>{n.message}</span>
                                <small>{n.time}</small>
                            </div>
                            <button onClick={() => setNotifications(p => p.filter(x => x.id !== n.id))}><X size={16} /></button>
                        </motion.div>
                    ))}
                </div>
            )}

            <div className="seller-page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                        <h1>Xoş gəlmisiniz 👋</h1>
                        <p>Satıcı panelinizə ümumi baxış</p>
                    </div>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="seller-logout"
                        style={{ width: 'auto', border: '1px solid var(--border)', padding: '0.7rem 1rem' }}
                    >
                        <LogOut size={18} />
                        <span>Çıxış</span>
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="seller-stats-grid">
                {statCards.map(c => <StatCard key={c.label} {...c} />)}
            </div>

            {/* Recent Orders */}
            <div className="seller-section glass">
                <div className="seller-section-header">
                    <h3>Son sifarişlər</h3>
                    <Link to="/seller/orders" className="seller-view-all">
                        Hamısına bax <ArrowRight size={15} />
                    </Link>
                </div>
                {recentOrders.length === 0 ? (
                    <p className="seller-empty">Hələ sifariş yoxdur.</p>
                ) : (
                    <div className="seller-order-list">
                        {recentOrders.map(o => (
                            <div key={o.id} className="seller-order-row">
                                <div className="seller-order-info">
                                    <span className="seller-order-id">#{(o.id || '').slice(0, 8)}</span>
                                    <span className="seller-order-title">{o.productTitle || o.product}</span>
                                </div>
                                <span className={`seller-status-badge status-${(o.status || '').toLowerCase()}`}>
                                    {statusLabel(o.status)}
                                </span>
                                <span className="seller-order-price">₼{parseFloat(o.totalPrice || 0).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SellerDashboard;
