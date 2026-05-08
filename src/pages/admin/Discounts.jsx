import React, { useState, useEffect, useCallback } from 'react';
import { Tag, Search, Plus, Trash2, X, ToggleRight } from 'lucide-react';
import RefreshBtn from '../../components/admin/RefreshBtn';
import SellerAutocomplete from '../../components/admin/SellerAutocomplete';
import api from '../../api/axios';
import './AdminShared.css';

const EMPTY = { code: '', type: 'PERCENTAGE', value: '', minOrderAmount: '', maxDiscountAmount: '', minQuantity: '', startDate: '', endDate: '', usageLimit: '', sellerId: '' };

const DiscountModal = ({ initial, onClose, onSave }) => {
    const [form, setForm] = useState(initial || EMPTY);
    const [saving, setSaving] = useState(false);
    const [selectedSeller, setSelectedSeller] = useState(null);
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const handleSave = async () => {
        if (!form.code || !form.value) return alert('Kod və dəyər tələb olunur');
        setSaving(true);
        try {
            const endpoint = form.sellerId ? '/discounts/seller' : '/discounts/admin';
            await api.post(endpoint, { ...form, value: parseFloat(form.value), minOrderAmount: form.minOrderAmount || null, maxDiscountAmount: form.maxDiscountAmount || null, minQuantity: form.minQuantity || null, usageLimit: form.usageLimit || null, sellerId: form.sellerId || null });
            onSave();
            onClose();
        } catch (e) { alert(e.response?.data?.message || 'Xəta'); }
        finally { setSaving(false); }
    };
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{initial ? 'Endirimi Redaktə Et' : 'Yeni Endirim'}</h3>
                    <button className="icon-btn" onClick={onClose}><X size={18} /></button>
                </div>
                <div className="modal-body">
                    <div className="form-row">
                        <div className="form-group">
                            <label>Promo Kod *</label>
                            <input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="PROMO KOD" />
                        </div>
                        <div className="form-group">
                            <label>Növ</label>
                            <select value={form.type} onChange={e => set('type', e.target.value)}>
                                <option value="PERCENTAGE">Faiz (%)</option>
                                <option value="FIXED_AMOUNT">Sabit məbləğ (₼)</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Dəyər *</label>
                            <input type="number" value={form.value} onChange={e => set('value', e.target.value)} placeholder={form.type === 'PERCENTAGE' ? '10' : '5.00'} />
                        </div>
                        <div className="form-group">
                            <label>Min. sifariş məbləği (₼)</label>
                            <input type="number" value={form.minOrderAmount} onChange={e => set('minOrderAmount', e.target.value)} placeholder="0.00" />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Max. endirim məbləği (₼)</label>
                            <input type="number" value={form.maxDiscountAmount} onChange={e => set('maxDiscountAmount', e.target.value)} placeholder="50.00" />
                        </div>
                        <div className="form-group">
                            <label>Min. miqdar (volume)</label>
                            <input type="number" value={form.minQuantity} onChange={e => set('minQuantity', e.target.value)} placeholder="2" />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Başlama tarixi</label>
                            <input type="datetime-local" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Bitmə tarixi</label>
                            <input type="datetime-local" value={form.endDate} onChange={e => set('endDate', e.target.value)} />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>İstifadə limiti</label>
                            <input type="number" value={form.usageLimit} onChange={e => set('usageLimit', e.target.value)} placeholder="100" />
                        </div>
                        <div className="form-group">
                            <label>Satıcı (boş = platforma)</label>
                            <SellerAutocomplete 
                                value={selectedSeller} 
                                onSelect={(seller) => {
                                    setSelectedSeller(seller);
                                    set('sellerId', seller.id);
                                }} 
                            />
                        </div>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose}>Ləğv et</button>
                    <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saxlanır...' : 'Saxla'}</button>
                </div>
            </div>
        </div>
    );
};

const Discounts = () => {
    const [discounts, setDiscounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [tab, setTab] = useState('platform');
    const [sellerForSearch, setSellerForSearch] = useState(null);
    const [sellerLookupId, setSellerLookupId] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [actionId, setActionId] = useState(null);

    const fetchDiscounts = useCallback(async () => {
        setLoading(true);
        try {
            if (tab === 'seller' && !sellerLookupId) {
                setDiscounts([]);
                return;
            }
            const endpoint = tab === 'platform' ? '/discounts/platform' : `/discounts/seller/${sellerLookupId}`;
            const res = await api.get(endpoint);
            setDiscounts(res.data.data || []);
        } catch { console.error('Discounts fetch error'); }
        finally { setLoading(false); }
    }, [tab, sellerLookupId]);

    useEffect(() => { fetchDiscounts(); }, [fetchDiscounts]);

    const handleDeactivate = async (id) => {
        if (!window.confirm('Bu endirimi deaktiv etmək istəyirsiniz?')) return;
        setActionId(id);
        try { await api.put(`/discounts/${id}/deactivate`); await fetchDiscounts(); }
        catch { alert('Xəta'); } finally { setActionId(null); }
    };

    const filtered = discounts.filter(d => d.code?.toLowerCase().includes(search.toLowerCase()));
    const active = discounts.filter(d => d.isActive).length;

    if (loading) return <div className="loading-state">Endirimlər yüklənir...</div>;

    return (
        <div className="admin-page">
            <header className="page-header">
                <div>
                    <h1>Endirim & Promo Kodlar</h1>
                    <p>Platforma və satıcı endirimlərini idarə et</p>
                </div>
                <div className="header-actions">
                    <div className="search-bar">
                        <Search size={16} />
                        <input placeholder="Kod axtar..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <button className="btn-primary" onClick={() => setShowModal(true)}><Plus size={16} />Yeni endirim</button>
                </div>
            </header>

            <div className="mini-stats">
                <div className="mini-stat-card"><div className="mini-stat-icon purple"><Tag size={20} /></div><div><div className="mini-stat-label">Ümumi</div><div className="mini-stat-value">{discounts.length}</div></div></div>
                <div className="mini-stat-card"><div className="mini-stat-icon green"><Tag size={20} /></div><div><div className="mini-stat-label">Aktiv</div><div className="mini-stat-value">{active}</div></div></div>
            </div>

            <div className="filter-tabs" style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button className={tab === 'platform' ? 'active' : ''} onClick={() => setTab('platform')}>Platforma kodları</button>
                <button className={tab === 'seller' ? 'active' : ''} onClick={() => setTab('seller')}>Satıcı kodları</button>
                {tab === 'seller' && (
                    <div style={{ minWidth: '280px' }}>
                        <SellerAutocomplete 
                            value={sellerForSearch} 
                            onSelect={(seller) => {
                                setSellerForSearch(seller);
                                setSellerLookupId(seller.id);
                            }} 
                        />
                    </div>
                )}
            </div>

            <div className="table-wrapper glass">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Kod</th>
                            <th>Növ / Dəyər</th>
                            <th>Min. sifariş</th>
                            <th>İstifadə</th>
                            <th>Bitmə tarixi</th>
                            <th>Status</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan="7" className="empty-row">{tab === 'seller' && !sellerLookupId ? 'Satıcı seçib Göstər düyməsinə basın.' : 'Endirim tapılmadı.'}</td></tr>
                        ) : filtered.map((d, i) => (
                            <tr key={d.id} className="animate-fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
                                <td><span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem', color: 'var(--primary)' }}>{d.code}</span></td>
                                <td>
                                    <span className={`badge ${d.type === 'PERCENTAGE' ? 'badge-purple' : 'badge-blue'}`}>
                                        {d.type === 'PERCENTAGE' ? `${d.value}%` : `₼${d.value}`}
                                    </span>
                                </td>
                                <td>{d.minOrderAmount ? `₼${d.minOrderAmount}` : '—'}</td>
                                <td>{d.usageCount ?? 0}{d.usageLimit ? ` / ${d.usageLimit}` : ''}</td>
                                <td style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>{d.endDate ? new Date(d.endDate).toLocaleDateString('az') : '—'}</td>
                                <td>{d.isActive ? <span className="badge badge-green">Aktiv</span> : <span className="badge badge-gray">Deaktiv</span>}</td>
                                <td>
                                    <div className="action-cell">
                                        {d.isActive && (
                                            <button className="icon-btn danger" title="Deaktiv et" onClick={() => handleDeactivate(d.id)} disabled={actionId === d.id}><ToggleRight size={16} /></button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && <DiscountModal onClose={() => setShowModal(false)} onSave={fetchDiscounts} />}
        </div>
    );
};

export default Discounts;
