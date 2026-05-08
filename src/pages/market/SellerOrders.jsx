import React, { useState, useEffect, useContext, useCallback } from 'react';
import { ShoppingCart, Search, ChevronDown } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import RefreshBtn from '../../components/admin/RefreshBtn';
import api from '../../api/axios';
import './SellerDashboard.css';
import './SellerOrders.css';

const STATUS_FLOW = {
    RECEIVED:  { label: 'Qəbul edildi', next: 'PREPARING',  nextLabel: 'Hazırla',   color: 'status-received'  },
    PREPARING: { label: 'Hazırlanır',   next: 'SHIPPING',   nextLabel: 'Yola sal',  color: 'status-preparing' },
    SHIPPING:  { label: 'Yoldadır',     next: 'DELIVERED',  nextLabel: 'Çatdırıldı',color: 'status-shipping'  },
    DELIVERED: { label: 'Çatdırılıb',  next: null,          nextLabel: null,        color: 'status-delivered' },
    CANCELLED: { label: 'Ləğv edildi', next: null,          nextLabel: null,        color: 'status-cancelled' },
};

const FILTERS = ['Hamısı', 'RECEIVED', 'PREPARING', 'SHIPPING', 'DELIVERED', 'CANCELLED'];

const SellerOrders = () => {
    const { user } = useContext(AuthContext);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('Hamısı');
    const [updatingId, setUpdatingId] = useState(null);

    const fetchOrders = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const res = await api.get('/seller/orders', { params: { sellerId: user.id } });
            setOrders(res.data?.data || []);
        } catch (e) {
            console.error('Orders fetch error', e);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const handleStatusUpdate = async (orderId, newStatus) => {
        setUpdatingId(orderId);
        try {
            await api.put(`/seller/order/${orderId}/status`, null, { params: { status: newStatus } });
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        } catch { alert('Status yenilənə bilmədi'); }
        finally { setUpdatingId(null); }
    };

    const filtered = orders.filter(o => {
        const matchFilter = filter === 'Hamısı' || o.status === filter;
        const matchSearch = !search ||
            (o.productTitle || '').toLowerCase().includes(search.toLowerCase()) ||
            (o.id || '').toLowerCase().includes(search.toLowerCase());
        return matchFilter && matchSearch;
    });

    const counts = FILTERS.reduce((acc, f) => {
        acc[f] = f === 'Hamısı' ? orders.length : orders.filter(o => o.status === f).length;
        return acc;
    }, {});

    const formatDate = (d) => {
        if (!d) return '';
        try { return new Date(d).toLocaleString('az-AZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
        catch { return d; }
    };

    if (loading) return <div className="seller-loading">Sifarişlər yüklənir...</div>;

    return (
        <div className="seller-page">
            <div className="seller-orders-header">
                <div className="seller-page-header" style={{ marginBottom: 0 }}>
                    <h1>Sifarişlər</h1>
                    <p>{orders.length} sifariş tapıldı</p>
                </div>
                <div className="seller-orders-actions">
                    <div className="seller-search-bar">
                        <Search size={15} />
                        <input
                            placeholder="Məhsul adı və ya ID..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <RefreshBtn onClick={fetchOrders} />
                </div>
            </div>

            {/* Filter tabs */}
            <div className="seller-filter-tabs">
                {FILTERS.map(f => (
                    <button
                        key={f}
                        className={filter === f ? 'active' : ''}
                        onClick={() => setFilter(f)}
                    >
                        {STATUS_FLOW[f]?.label || f}
                        {counts[f] > 0 && <span className="tab-count">{counts[f]}</span>}
                    </button>
                ))}
            </div>

            {/* Orders */}
            {filtered.length === 0 ? (
                <div className="seller-empty-state glass">
                    <ShoppingCart size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                    <p>Bu filtrdə sifariş tapılmadı.</p>
                </div>
            ) : (
                <div className="seller-orders-grid">
                    {filtered.map((o, i) => {
                        const s = STATUS_FLOW[o.status] || { label: o.status, color: 'status-received' };
                        return (
                            <div key={o.id} className="seller-order-card glass animate-fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
                                <div className="soc-header">
                                    <div>
                                        <span className="soc-id">#{(o.id || '').slice(0, 8)}</span>
                                        <span className="soc-date">{formatDate(o.createdAt)}</span>
                                    </div>
                                    <span className={`seller-status-badge ${s.color}`}>{s.label}</span>
                                </div>

                                <div className="soc-product">
                                    <strong>{o.productTitle || o.product || '—'}</strong>
                                    <span>x{o.quantity || 1}</span>
                                </div>

                                <div className="soc-meta">
                                    <div className="soc-meta-row">
                                        <span className="soc-meta-label">Müştəri</span>
                                        <span>{o.customer || o.buyerId?.slice(0, 8) || '—'}</span>
                                    </div>
                                    <div className="soc-meta-row">
                                        <span className="soc-meta-label">Ödəniş</span>
                                        <span>{o.payment || o.paymentMethod || '—'}</span>
                                    </div>
                                    <div className="soc-meta-row">
                                        <span className="soc-meta-label">Çatdırılma</span>
                                        <span>{o.delivery || o.deliveryCity || '—'}</span>
                                    </div>
                                </div>

                                <div className="soc-footer">
                                    <span className="soc-price">₼{parseFloat(o.totalPrice || 0).toFixed(2)}</span>
                                    {s.next && (
                                        <button
                                            className="soc-action-btn"
                                            onClick={() => handleStatusUpdate(o.id, s.next)}
                                            disabled={updatingId === o.id}
                                        >
                                            {updatingId === o.id ? 'Yenilənir...' : s.nextLabel}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default SellerOrders;
