import React, { useState, useEffect, useCallback } from 'react';
import {
    Store, Search, CheckCircle, XCircle, AlertTriangle,
    DollarSign, Edit2, X, TrendingUp, TrendingDown,
    ShoppingCart, Percent, Minus
} from 'lucide-react';
import RefreshBtn from '../../components/admin/RefreshBtn';
import api from '../../api/axios';
import './AdminShared.css';
import './Sellers.css';

const statusBadge = (status) => {
    const map = {
        ACTIVE: 'badge-green',
        DEACTIVATED: 'badge-gray',
        BANNED: 'badge-red',
        PENALIZED: 'badge-orange',
        PENDING_VERIFICATION: 'badge-blue'
    };
    return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>;
};

const fmt = (v) => parseFloat(v || 0).toFixed(2);

/* ── Commission Modal ─────────────────────────────────────── */
const CommissionModal = ({ seller, onClose, onSave }) => {
    const [rate, setRate] = useState(seller?.commissionRate ?? 10);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put(`/admin/sellers/${seller.id}/commission`, null, {
                params: { commissionRate: rate }
            });
            onSave();
            onClose();
        } catch { alert('Xəta baş verdi'); }
        finally { setSaving(false); }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Komissiya Faizi</h3>
                    <button className="icon-btn" onClick={onClose}><X size={18} /></button>
                </div>
                <div className="modal-body">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--bg)', borderRadius: '1rem', marginBottom: '0.5rem' }}>
                        <img src={seller.profileImageUrl} alt={seller.name}
                            style={{ width: 48, height: 48, borderRadius: '0.75rem', objectFit: 'cover' }}
                            onError={e => e.target.style.display = 'none'} />
                        <div>
                            <div style={{ fontWeight: 700 }}>{seller.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{seller.email}</div>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Komissiya faizi (0 – 100%)</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <input
                                type="range" min="0" max="50" step="0.5"
                                value={rate}
                                onChange={e => setRate(parseFloat(e.target.value))}
                                style={{ flex: 1 }}
                            />
                            <div style={{ minWidth: 64, textAlign: 'center', fontWeight: 700, fontSize: '1.3rem', color: 'var(--primary)' }}>
                                {rate}%
                            </div>
                        </div>
                        <input
                            type="number" min="0" max="100" step="0.5"
                            value={rate}
                            onChange={e => setRate(parseFloat(e.target.value))}
                            style={{ marginTop: '0.5rem' }}
                        />
                    </div>
                    {seller.monthlyRevenue > 0 && (
                        <div style={{ background: 'rgba(18,119,73,0.06)', borderRadius: '0.75rem', padding: '0.75rem 1rem', fontSize: '0.9rem' }}>
                            Bu ay gəliri <strong>₼{fmt(seller.monthlyRevenue)}</strong> üzərindən komissiya:{' '}
                            <strong style={{ color: 'var(--primary)' }}>
                                ₼{(parseFloat(seller.monthlyRevenue) * rate / 100).toFixed(2)}
                            </strong>
                        </div>
                    )}
                </div>
                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose}>Ləğv et</button>
                    <button className="btn-primary" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saxlanır...' : 'Saxla'}
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ── Payout Modal ─────────────────────────────────────────── */
const PayoutModal = ({ seller, onClose }) => {
    const [amount, setAmount] = useState(fmt(seller.monthlyNetPayout));
    const [result, setResult] = useState(null);
    const [saving, setSaving] = useState(false);

    const handlePayout = async () => {
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) return alert('Düzgün məbləğ daxil edin');
        setSaving(true);
        try {
            const res = await api.post(`/admin/sellers/${seller.id}/payout`, null, { params: { amount } });
            setResult(res.data.data);
        } catch { alert('Xəta baş verdi'); }
        finally { setSaving(false); }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Ödəniş — {seller.name}</h3>
                    <button className="icon-btn" onClick={onClose}><X size={18} /></button>
                </div>
                <div className="modal-body">
                    {result ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {[
                                ['Brüt məbləğ', `₼${fmt(result.grossAmount)}`, 'gold'],
                                ['Komissiya', `₼${fmt(result.commission)}`, 'orange'],
                                ['Net ödəniş', `₼${fmt(result.netPayout)}`, 'green'],
                            ].map(([label, val, color]) => (
                                <div key={label} className="mini-stat-card">
                                    <div className={`mini-stat-icon ${color}`}><DollarSign size={20} /></div>
                                    <div><div className="mini-stat-label">{label}</div><div className="mini-stat-value">{val}</div></div>
                                </div>
                            ))}
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', textAlign: 'center' }}>
                                {result.processedAt ? new Date(result.processedAt).toLocaleString('az') : ''}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                                {[
                                    ['Bu ay gəlir', `₼${fmt(seller.monthlyRevenue)}`],
                                    ['Komissiya', `₼${fmt(seller.monthlyCommissionDue)}`],
                                    ['Net ödəniş', `₼${fmt(seller.monthlyNetPayout)}`],
                                    ['Komissiya %', `${seller.commissionRate ?? 10}%`],
                                ].map(([label, val]) => (
                                    <div key={label} style={{ background: 'var(--bg)', borderRadius: '0.75rem', padding: '0.75rem' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600 }}>{label}</div>
                                        <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{val}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="form-group">
                                <label>Ödəniş məbləği (₼)</label>
                                <input type="number" min="0" step="0.01" value={amount}
                                    onChange={e => setAmount(e.target.value)} placeholder="0.00" />
                            </div>
                        </>
                    )}
                </div>
                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose}>{result ? 'Bağla' : 'Ləğv et'}</button>
                    {!result && (
                        <button className="btn-primary" onClick={handlePayout} disabled={saving}>
                            {saving ? 'İcra olunur...' : 'Ödə'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

/* ── Seller Detail Panel ──────────────────────────────────── */
const SellerDetail = ({ seller, onClose, onRefresh }) => {
    const [stats, setStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
        api.get(`/admin/sellers/${seller.id}`)
            .then(r => setStats(r.data.data))
            .catch(() => {})
            .finally(() => setLoadingStats(false));
    }, [seller.id]);

    const s = stats || seller;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Satıcı Profili</h3>
                    <button className="icon-btn" onClick={onClose}><X size={18} /></button>
                </div>
                <div className="modal-body">
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                        <img src={s.profileImageUrl} alt={s.name}
                            style={{ width: 64, height: 64, borderRadius: '1rem', objectFit: 'cover', border: '2px solid var(--border)' }}
                            onError={e => e.target.style.display = 'none'} />
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{s.name}</div>
                            <div style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>{s.email}</div>
                            <div style={{ marginTop: '0.3rem' }}>{statusBadge(s.status)}</div>
                        </div>
                    </div>

                    {loadingStats ? (
                        <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-light)' }}>Yüklənir...</div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            {[
                                ['Bu ay sifarişlər', s.monthlyOrders ?? 0, 'blue'],
                                ['Bu ay gəlir', `₼${fmt(s.monthlyRevenue)}`, 'green'],
                                ['Komissiya faizi', `${s.commissionRate ?? 10}%`, 'orange'],
                                ['Alınacaq komissiya', `₼${fmt(s.monthlyCommissionDue)}`, 'red'],
                                ['Net ödəniş', `₼${fmt(s.monthlyNetPayout)}`, 'purple'],
                                ['Ümumi ödənilmiş', `₼${fmt(s.paymentsTotal)}`, 'gold'],
                            ].map(([label, val, color]) => (
                                <div key={label} className="mini-stat-card">
                                    <div className={`mini-stat-icon ${color}`}><DollarSign size={18} /></div>
                                    <div>
                                        <div className="mini-stat-label">{label}</div>
                                        <div className="mini-stat-value" style={{ fontSize: '1.1rem' }}>{val}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {s.penalizeReason && (
                        <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginTop: '0.5rem', fontSize: '0.9rem', color: '#ef4444' }}>
                            <strong>Cəza səbəbi:</strong> {s.penalizeReason}
                        </div>
                    )}
                </div>
                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose}>Bağla</button>
                </div>
            </div>
        </div>
    );
};

/* ── Main Component ───────────────────────────────────────── */
const Sellers = () => {
    const [sellers, setSellers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [commissionSeller, setCommissionSeller] = useState(null);
    const [payoutSeller, setPayoutSeller] = useState(null);
    const [detailSeller, setDetailSeller] = useState(null);
    const [actionId, setActionId] = useState(null);

    const fetchSellers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/sellers');
            setSellers(res.data.data || []);
        } catch { console.error('Sellers fetch error'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchSellers(); }, [fetchSellers]);

    const handleActivate = async (id) => {
        setActionId(id);
        try { await api.put(`/admin/sellers/${id}/activate`); await fetchSellers(); }
        catch { alert('Xəta'); } finally { setActionId(null); }
    };

    const handleDeactivate = async (id) => {
        if (!window.confirm('Bu satıcını deaktiv etmək istəyirsiniz?')) return;
        setActionId(id);
        try { await api.put(`/admin/sellers/${id}/deactivate`); await fetchSellers(); }
        catch { alert('Xəta'); } finally { setActionId(null); }
    };

    const handlePenalize = async (id) => {
        const reason = window.prompt('Cəza səbəbini yazın:');
        if (!reason) return;
        setActionId(id);
        try { await api.put(`/admin/sellers/${id}/penalize`, null, { params: { reason } }); await fetchSellers(); }
        catch { alert('Xəta'); } finally { setActionId(null); }
    };

    const filtered = sellers.filter(s =>
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase())
    );

    const totalCommissionDue = sellers.reduce((s, sel) => s + parseFloat(sel.monthlyCommissionDue || 0), 0);
    const totalMonthlyRevenue = sellers.reduce((s, sel) => s + parseFloat(sel.monthlyRevenue || 0), 0);
    const activeSellers = sellers.filter(s => s.status === 'ACTIVE').length;

    if (loading) return <div className="loading-state">Satıcılar yüklənir...</div>;

    return (
        <div className="admin-page">
            <header className="page-header">
                <div>
                    <h1>Satıcı İdarəetmə</h1>
                    <p>Satıcıları aktivləşdir, komissiya təyin et, ödənişləri idarə et</p>
                </div>
                <div className="header-actions">
                    <div className="search-bar">
                        <Search size={16} />
                        <input placeholder="Ad və ya email axtar..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <RefreshBtn onClick={fetchSellers} />
                </div>
            </header>

            <div className="mini-stats">
                <div className="mini-stat-card">
                    <div className="mini-stat-icon blue"><Store size={20} /></div>
                    <div><div className="mini-stat-label">Ümumi satıcı</div><div className="mini-stat-value">{sellers.length}</div></div>
                </div>
                <div className="mini-stat-card">
                    <div className="mini-stat-icon green"><CheckCircle size={20} /></div>
                    <div><div className="mini-stat-label">Aktiv</div><div className="mini-stat-value">{activeSellers}</div></div>
                </div>
                <div className="mini-stat-card">
                    <div className="mini-stat-icon gold"><DollarSign size={20} /></div>
                    <div><div className="mini-stat-label">Bu ay gəlir</div><div className="mini-stat-value">₼{totalMonthlyRevenue.toFixed(2)}</div></div>
                </div>
                <div className="mini-stat-card">
                    <div className="mini-stat-icon orange"><Percent size={20} /></div>
                    <div><div className="mini-stat-label">Alınacaq komissiya</div><div className="mini-stat-value">₼{totalCommissionDue.toFixed(2)}</div></div>
                </div>
            </div>

            <div className="table-wrapper glass">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Satıcı</th>
                            <th>Status</th>
                            <th>Bu ay gəlir</th>
                            <th>Komissiya %</th>
                            <th>Alınacaq komissiya</th>
                            <th>Net ödəniş</th>
                            <th>Əməliyyatlar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan="7" className="empty-row">Satıcı tapılmadı.</td></tr>
                        ) : filtered.map((s, i) => (
                            <tr key={s.id} className="animate-fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <img src={s.profileImageUrl} alt={s.name}
                                            style={{ width: 40, height: 40, borderRadius: '0.75rem', objectFit: 'cover' }}
                                            onError={e => e.target.style.display = 'none'} />
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{s.name}</div>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>{s.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>{statusBadge(s.status)}</td>
                                <td>
                                    <span style={{ fontWeight: 600 }}>₼{fmt(s.monthlyRevenue)}</span>
                                    {s.monthlyOrders > 0 && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{s.monthlyOrders} sifariş</div>
                                    )}
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '1rem' }}>{s.commissionRate ?? 10}%</span>
                                        <button
                                            className="icon-btn"
                                            title="Komissiya dəyiş"
                                            onClick={() => setCommissionSeller(s)}
                                            style={{ width: 28, height: 28 }}
                                        >
                                            <Edit2 size={13} />
                                        </button>
                                    </div>
                                </td>
                                <td>
                                    <span style={{ fontWeight: 600, color: '#ef4444' }}>₼{fmt(s.monthlyCommissionDue)}</span>
                                </td>
                                <td>
                                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>₼{fmt(s.monthlyNetPayout)}</span>
                                </td>
                                <td>
                                    <div className="action-cell">
                                        <button className="icon-btn" title="Detallar" onClick={() => setDetailSeller(s)}>
                                            <Store size={15} />
                                        </button>
                                        {s.status !== 'ACTIVE' ? (
                                            <button className="icon-btn success" title="Aktivləşdir"
                                                onClick={() => handleActivate(s.id)} disabled={actionId === s.id}>
                                                <CheckCircle size={15} />
                                            </button>
                                        ) : (
                                            <button className="icon-btn danger" title="Deaktiv et"
                                                onClick={() => handleDeactivate(s.id)} disabled={actionId === s.id}>
                                                <XCircle size={15} />
                                            </button>
                                        )}
                                        <button className="icon-btn warning" title="Cəzalandır"
                                            onClick={() => handlePenalize(s.id)} disabled={actionId === s.id}>
                                            <AlertTriangle size={15} />
                                        </button>
                                        <button className="icon-btn success" title="Ödəniş et"
                                            onClick={() => setPayoutSeller(s)}>
                                            <DollarSign size={15} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {commissionSeller && (
                <CommissionModal
                    seller={commissionSeller}
                    onClose={() => setCommissionSeller(null)}
                    onSave={fetchSellers}
                />
            )}
            {payoutSeller && (
                <PayoutModal
                    seller={payoutSeller}
                    onClose={() => setPayoutSeller(null)}
                />
            )}
            {detailSeller && (
                <SellerDetail
                    seller={detailSeller}
                    onClose={() => setDetailSeller(null)}
                    onRefresh={fetchSellers}
                />
            )}
        </div>
    );
};

export default Sellers;
