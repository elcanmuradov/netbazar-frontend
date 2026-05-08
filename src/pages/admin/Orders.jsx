import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingCart, Search, Eye, X, ChevronDown } from 'lucide-react';
import RefreshBtn from '../../components/admin/RefreshBtn';
import api from '../../api/axios';
import './AdminShared.css';

const STATUS_OPTIONS = ['RECEIVED', 'PREPARING', 'SHIPPING', 'DELIVERED', 'CANCELLED'];

const statusBadge = (s) => {
    const map = { RECEIVED: 'badge-blue', PREPARING: 'badge-orange', SHIPPING: 'badge-purple', DELIVERED: 'badge-green', CANCELLED: 'badge-red' };
    return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
};

const OrderDetailModal = ({ order, onClose, onStatusChange }) => {
    const [status, setStatus] = useState(order.status);
    const [saving, setSaving] = useState(false);
    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put(`/admin/orders/${order.id}/status`, null, { params: { status } });
            onStatusChange();
            onClose();
        } catch { alert('Xəta'); } finally { setSaving(false); }
    };
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Sifariş Detalları</h3>
                    <button className="icon-btn" onClick={onClose}><X size={18} /></button>
                </div>
                <div className="modal-body">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        {[
                            ['Məhsul', order.productTitle],
                            ['Alıcı ID', order.buyerId?.slice(0, 8) + '...'],
                            ['Satıcı ID', order.sellerId?.slice(0, 8) + '...'],
                            ['Miqdar', order.quantity],
                            ['Orijinal qiymət', `₼${order.originalPrice ?? order.totalPrice}`],
                            ['Endirim', `₼${order.discountAmount ?? '0.00'}`],
                            ['Yekun qiymət', `₼${order.totalPrice}`],
                            ['Ödəniş', order.paymentMethod],
                            ['Çatdırılma şəhəri', order.deliveryCity || '—'],
                            ['Promo kod', order.discountCode || '—'],
                            ['Tarix', order.createdAt ? new Date(order.createdAt).toLocaleString('az') : '—'],
                        ].map(([label, val]) => (
                            <div key={label} style={{ background: 'var(--bg)', borderRadius: '0.75rem', padding: '0.75rem 1rem' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600, marginBottom: '0.2rem' }}>{label}</div>
                                <div style={{ fontWeight: 600 }}>{val}</div>
                            </div>
                        ))}
                    </div>
                    <div className="form-group" style={{ marginTop: '0.5rem' }}>
                        <label>Status dəyiş</label>
                        <select value={status} onChange={e => setStatus(e.target.value)}>
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose}>Bağla</button>
                    <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saxlanır...' : 'Statusu yenilə'}</button>
                </div>
            </div>
        </div>
    );
};

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [selected, setSelected] = useState(null);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const params = filterStatus ? { status: filterStatus } : {};
            const res = await api.get('/admin/orders', { params });
            setOrders(res.data.data || []);
        } catch { console.error('Orders fetch error'); }
        finally { setLoading(false); }
    }, [filterStatus]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const filtered = orders.filter(o =>
        o.productTitle?.toLowerCase().includes(search.toLowerCase()) ||
        o.id?.toLowerCase().includes(search.toLowerCase())
    );

    const total = orders.length;
    const delivered = orders.filter(o => o.status === 'DELIVERED').length;
    const revenue = orders.reduce((s, o) => s + parseFloat(o.totalPrice || 0), 0).toFixed(2);

    if (loading) return <div className="loading-state">Sifarişlər yüklənir...</div>;

    return (
        <div className="admin-page">
            <header className="page-header">
                <div>
                    <h1>Sifariş İdarəetmə</h1>
                    <p>Bütün sifarişlər, status idarəetmə və detallar</p>
                </div>
                <div className="header-actions">
                    <div className="search-bar">
                        <Search size={16} />
                        <input placeholder="Məhsul adı və ya ID axtar..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <RefreshBtn onClick={fetchOrders} />
                </div>
            </header>

            <div className="mini-stats">
                <div className="mini-stat-card"><div className="mini-stat-icon blue"><ShoppingCart size={20} /></div><div><div className="mini-stat-label">Ümumi sifariş</div><div className="mini-stat-value">{total}</div></div></div>
                <div className="mini-stat-card"><div className="mini-stat-icon green"><ShoppingCart size={20} /></div><div><div className="mini-stat-label">Çatdırıldı</div><div className="mini-stat-value">{delivered}</div></div></div>
                <div className="mini-stat-card"><div className="mini-stat-icon gold"><ShoppingCart size={20} /></div><div><div className="mini-stat-label">Ümumi gəlir</div><div className="mini-stat-value">₼{revenue}</div></div></div>
            </div>

            <div className="filter-tabs">
                {['', ...STATUS_OPTIONS].map(s => (
                    <button key={s} className={filterStatus === s ? 'active' : ''} onClick={() => setFilterStatus(s)}>
                        {s || 'Hamısı'}
                    </button>
                ))}
            </div>

            <div className="table-wrapper glass">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Məhsul</th>
                            <th>Status</th>
                            <th>Qiymət</th>
                            <th>Endirim</th>
                            <th>Ödəniş</th>
                            <th>Tarix</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan="7" className="empty-row">Sifariş tapılmadı.</td></tr>
                        ) : filtered.map((o, i) => (
                            <tr key={o.id} className="animate-fade-in" style={{ animationDelay: `${i * 0.03}s` }}>
                                <td>
                                    <div style={{ fontWeight: 600 }}>{o.productTitle}</div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>x{o.quantity}</div>
                                </td>
                                <td>{statusBadge(o.status)}</td>
                                <td style={{ fontWeight: 700 }}>₼{o.totalPrice}</td>
                                <td>{o.discountAmount > 0 ? <span className="badge badge-green">-₼{o.discountAmount}</span> : '—'}</td>
                                <td><span className="badge badge-gray">{o.paymentMethod}</span></td>
                                <td style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>{o.createdAt ? new Date(o.createdAt).toLocaleDateString('az') : '—'}</td>
                                <td>
                                    <button className="icon-btn" title="Detallar" onClick={() => setSelected(o)}><Eye size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selected && <OrderDetailModal order={selected} onClose={() => setSelected(null)} onStatusChange={fetchOrders} />}
        </div>
    );
};

export default Orders;
