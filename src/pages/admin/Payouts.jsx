import React, { useState, useEffect, useCallback } from 'react';
import {
    DollarSign, TrendingUp, TrendingDown,
    Minus, ShoppingCart, Percent, BarChart3, ArrowUpRight
} from 'lucide-react';
import RefreshBtn from '../../components/admin/RefreshBtn';
import api from '../../api/axios';
import './AdminShared.css';
import './Payouts.css';

const fmt = (v) => parseFloat(v || 0).toFixed(2);

const GrowthBadge = ({ value }) => {
    const n = parseFloat(value || 0);
    if (n > 0) return (
        <span className="growth-badge positive">
            <TrendingUp size={12} /> +{n.toFixed(1)}%
        </span>
    );
    if (n < 0) return (
        <span className="growth-badge negative">
            <TrendingDown size={12} /> {n.toFixed(1)}%
        </span>
    );
    return <span className="growth-badge neutral"><Minus size={12} /> 0%</span>;
};

const CompareCard = ({ label, current, previous, growth, prefix = '₼', color = 'green' }) => (
    <div className="compare-card glass">
        <div className="compare-card-header">
            <span className="compare-label">{label}</span>
            <GrowthBadge value={growth} />
        </div>
        <div className="compare-values">
            <div className="compare-current">
                <div className="compare-period">Bu ay</div>
                <div className={`compare-amount ${color}`}>{prefix}{fmt(current)}</div>
            </div>
            <div className="compare-divider" />
            <div className="compare-prev">
                <div className="compare-period">Keçən ay</div>
                <div className="compare-amount-prev">{prefix}{fmt(previous)}</div>
            </div>
        </div>
    </div>
);

const Payouts = () => {
    const [payouts, setPayouts] = useState([]);
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reportLoading, setReportLoading] = useState(true);
    const [tab, setTab] = useState('report');

    const fetchAll = useCallback(async () => {
        setLoading(true);
        setReportLoading(true);
        try {
            const [payoutsRes, reportRes] = await Promise.all([
                api.get('/admin/payouts'),
                api.get('/admin/reports/monthly')
            ]);
            setPayouts(payoutsRes.data.data || []);
            setReport(reportRes.data.data || null);
        } catch (e) {
            console.error('Payouts/report fetch error', e);
        } finally {
            setLoading(false);
            setReportLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const cur = report?.currentMonth || {};
    const prev = report?.previousMonth || {};
    const comp = report?.comparison || {};

    const totalNetPayout = payouts.reduce((s, p) => s + parseFloat(p.monthlyNetPayout || 0), 0);
    const totalCommission = payouts.reduce((s, p) => s + parseFloat(p.monthlyCommissionDue || 0), 0);

    return (
        <div className="admin-page">
            <header className="page-header">
                <div>
                    <h1>Ödəniş & Hesabat</h1>
                    <p>Aylıq müqayisə, komissiya hesabatı və satıcı ödənişləri</p>
                </div>
                <RefreshBtn onClick={fetchAll} />
            </header>

            {/* Tab switcher */}
            <div className="filter-tabs" style={{ marginBottom: '2rem' }}>
                <button className={tab === 'report' ? 'active' : ''} onClick={() => setTab('report')}>
                    <BarChart3 size={15} /> Aylıq Hesabat
                </button>
                <button className={tab === 'sellers' ? 'active' : ''} onClick={() => setTab('sellers')}>
                    <DollarSign size={15} /> Satıcı Ödənişləri
                </button>
            </div>

            {/* ── MONTHLY REPORT TAB ── */}
            {tab === 'report' && (
                <>
                    {reportLoading ? (
                        <div className="loading-state">Hesabat yüklənir...</div>
                    ) : !report ? (
                        <div className="loading-state">Hesabat məlumatı tapılmadı.</div>
                    ) : (
                        <>
                            {/* Compare cards */}
                            <div className="compare-grid">
                                <CompareCard
                                    label="Ümumi gəlir"
                                    current={cur.revenue}
                                    previous={prev.revenue}
                                    growth={comp.revenueGrowth}
                                    color="green"
                                />
                                <CompareCard
                                    label="Sifariş sayı"
                                    current={cur.orders}
                                    previous={prev.orders}
                                    growth={comp.orderGrowth}
                                    prefix=""
                                    color="blue"
                                />
                                <CompareCard
                                    label="Komissiya gəliri"
                                    current={cur.commission}
                                    previous={prev.commission}
                                    growth={comp.commissionGrowth}
                                    color="orange"
                                />
                                <CompareCard
                                    label="Satıcılara ödəniş"
                                    current={cur.payout}
                                    previous={prev.payout}
                                    growth={comp.revenueGrowth}
                                    color="purple"
                                />
                            </div>

                            {/* Side-by-side detail table */}
                            <div className="report-detail glass">
                                <div className="report-detail-header">
                                    <h3>Ətraflı müqayisə</h3>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                                        {report.generatedAt ? new Date(report.generatedAt).toLocaleString('az') : ''}
                                    </span>
                                </div>
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Göstərici</th>
                                            <th>Bu ay</th>
                                            <th>Keçən ay</th>
                                            <th>Dəyişim</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[
                                            ['Ümumi gəlir (₼)', fmt(cur.revenue), fmt(prev.revenue), comp.revenueGrowth],
                                            ['Sifariş sayı', cur.orders ?? 0, prev.orders ?? 0, comp.orderGrowth],
                                            ['Komissiya (₼)', fmt(cur.commission), fmt(prev.commission), comp.commissionGrowth],
                                            ['Satıcı ödənişi (₼)', fmt(cur.payout), fmt(prev.payout), comp.revenueGrowth],
                                        ].map(([label, curVal, prevVal, growth]) => (
                                            <tr key={label}>
                                                <td style={{ fontWeight: 600 }}>{label}</td>
                                                <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{curVal}</td>
                                                <td style={{ color: 'var(--text-light)' }}>{prevVal}</td>
                                                <td><GrowthBadge value={growth} /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </>
            )}

            {/* ── SELLER PAYOUTS TAB ── */}
            {tab === 'sellers' && (
                <>
                    {loading ? (
                        <div className="loading-state">Satıcı ödənişləri yüklənir...</div>
                    ) : (
                        <>
                            <div className="mini-stats" style={{ marginBottom: '1.5rem' }}>
                                <div className="mini-stat-card">
                                    <div className="mini-stat-icon gold"><DollarSign size={20} /></div>
                                    <div>
                                        <div className="mini-stat-label">Bu ay net ödəniş</div>
                                        <div className="mini-stat-value">₼{totalNetPayout.toFixed(2)}</div>
                                    </div>
                                </div>
                                <div className="mini-stat-card">
                                    <div className="mini-stat-icon orange"><Percent size={20} /></div>
                                    <div>
                                        <div className="mini-stat-label">Bu ay komissiya</div>
                                        <div className="mini-stat-value">₼{totalCommission.toFixed(2)}</div>
                                    </div>
                                </div>
                                <div className="mini-stat-card">
                                    <div className="mini-stat-icon blue"><ShoppingCart size={20} /></div>
                                    <div>
                                        <div className="mini-stat-label">Satıcı sayı</div>
                                        <div className="mini-stat-value">{payouts.length}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="table-wrapper glass">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Satıcı</th>
                                            <th>Bu ay sifarişlər</th>
                                            <th>Bu ay gəlir</th>
                                            <th>Komissiya %</th>
                                            <th>Alınacaq komissiya</th>
                                            <th>Net ödəniş</th>
                                            <th>Ümumi ödənilmiş</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payouts.length === 0 ? (
                                            <tr><td colSpan="7" className="empty-row">Məlumat tapılmadı.</td></tr>
                                        ) : payouts.map((p, i) => (
                                            <tr key={p.sellerId} className="animate-fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
                                                <td>
                                                    <div style={{ fontWeight: 600 }}>{p.sellerName}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontFamily: 'monospace' }}>
                                                        {p.sellerId?.slice(0, 12)}...
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="badge badge-blue">{p.monthlyOrders ?? 0}</span>
                                                </td>
                                                <td style={{ fontWeight: 600 }}>₼{fmt(p.monthlyRevenue)}</td>
                                                <td>
                                                    <span style={{ fontWeight: 700, color: 'var(--accent)' }}>
                                                        {p.commissionRate ?? 10}%
                                                    </span>
                                                </td>
                                                <td style={{ fontWeight: 600, color: '#ef4444' }}>
                                                    ₼{fmt(p.monthlyCommissionDue)}
                                                </td>
                                                <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                                                    ₼{fmt(p.monthlyNetPayout)}
                                                </td>
                                                <td style={{ color: 'var(--text-light)' }}>
                                                    ₼{fmt(p.totalPaid)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default Payouts;
