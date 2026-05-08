import React, { useState, useEffect, useCallback } from 'react';
import { Zap, Plus, Trash2, Edit2, X } from 'lucide-react';
import RefreshBtn from '../../components/admin/RefreshBtn';
import api from '../../api/axios';
import './AdminShared.css';

const EMPTY = { name: '', description: '', discountType: 'PERCENTAGE', discountValue: '', startDate: '', endDate: '', isActive: true, bannerUrl: '' };

const CampaignModal = ({ initial, onClose, onSave }) => {
    const [form, setForm] = useState(initial || EMPTY);
    const [saving, setSaving] = useState(false);
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const handleSave = async () => {
        if (!form.name) return alert('Ad tələb olunur');
        setSaving(true);
        try {
            const payload = { ...form, discountValue: form.discountValue ? parseFloat(form.discountValue) : null };
            if (initial?.id) await api.put(`/admin/campaigns/${initial.id}`, payload);
            else await api.post('/admin/campaigns', payload);
            onSave(); onClose();
        } catch { alert('Xəta'); } finally { setSaving(false); }
    };
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{initial?.id ? 'Kampaniyanı Redaktə Et' : 'Yeni Kampaniya'}</h3>
                    <button className="icon-btn" onClick={onClose}><X size={18} /></button>
                </div>
                <div className="modal-body">
                    <div className="form-group"><label>Ad *</label><input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Bahar Endirimi 2026" /></div>
                    <div className="form-group"><label>Açıqlama</label><textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Kampaniya haqqında..." rows="2" /></div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Endirim növü</label>
                            <select value={form.discountType} onChange={e => set('discountType', e.target.value)}>
                                <option value="PERCENTAGE">Faiz (%)</option>
                                <option value="FIXED_AMOUNT">Sabit məbləğ (₼)</option>
                            </select>
                        </div>
                        <div className="form-group"><label>Dəyər *</label><input type="number" value={form.discountValue} onChange={e => set('discountValue', e.target.value)} placeholder="10" /></div>
                    </div>
                    <div className="form-row">
                        <div className="form-group"><label>Başlama</label><input type="datetime-local" value={form.startDate} onChange={e => set('startDate', e.target.value)} /></div>
                        <div className="form-group"><label>Bitmə</label><input type="datetime-local" value={form.endDate} onChange={e => set('endDate', e.target.value)} /></div>
                    </div>
                    <div className="form-group"><label>Banner URL (isteğe bağlı)</label><input value={form.bannerUrl} onChange={e => set('bannerUrl', e.target.value)} placeholder="https://..." /></div>
                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} />Aktiv
                        </label>
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

const Campaigns = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null);
    const [actionId, setActionId] = useState(null);

    const fetchCampaigns = useCallback(async () => {
        setLoading(true);
        try { const res = await api.get('/admin/campaigns'); setCampaigns(res.data.data || []); }
        catch { console.error('Campaigns fetch error'); } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

    const handleDelete = async (id) => {
        if (!window.confirm('Bu kampaniyanı silmək istəyirsiniz?')) return;
        setActionId(id);
        try { await api.delete(`/admin/campaigns/${id}`); await fetchCampaigns(); }
        catch { alert('Xəta'); } finally { setActionId(null); }
    };

    const handleToggleActive = async (id, isActive) => {
        setActionId(id);
        try {
            const endpoint = isActive ? `/admin/campaigns/${id}/deactivate` : `/admin/campaigns/${id}/activate`;
            await api.put(endpoint);
            await fetchCampaigns();
        } catch { alert('Xəta'); } finally { setActionId(null); }
    };

    const active = campaigns.filter(c => c.isActive).length;

    if (loading) return <div className="loading-state">Kampaniyalar yüklənir...</div>;

    return (
        <div className="admin-page">
            <header className="page-header">
                <div>
                    <h1>Kampaniya Meneceri</h1>
                    <p>Alıcılara göstəriləcək endirim kampaniyaları</p>
                </div>
                <div className="header-actions">
                    <RefreshBtn onClick={fetchCampaigns} />
                    <button className="btn-primary" onClick={() => setModal('new')}><Plus size={16} />Yeni kampaniya</button>
                </div>
            </header>

            <div className="mini-stats">
                <div className="mini-stat-card"><div className="mini-stat-icon orange"><Zap size={20} /></div><div><div className="mini-stat-label">Ümumi</div><div className="mini-stat-value">{campaigns.length}</div></div></div>
                <div className="mini-stat-card"><div className="mini-stat-icon green"><Zap size={20} /></div><div><div className="mini-stat-label">Aktiv</div><div className="mini-stat-value">{active}</div></div></div>
            </div>

            <div className="table-wrapper glass">
                <table className="admin-table">
                    <thead>
                        <tr><th>Ad</th><th>Endirim</th><th>Başlama</th><th>Bitmə</th><th>Status</th><th></th></tr>
                    </thead>
                    <tbody>
                        {campaigns.length === 0 ? (
                            <tr><td colSpan="6" className="empty-row">Kampaniya tapılmadı.</td></tr>
                        ) : campaigns.map((c, i) => (
                            <tr key={c.id} className="animate-fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
                                <td>
                                    <div style={{ fontWeight: 600 }}>{c.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{c.description?.slice(0, 50)}</div>
                                </td>
                                <td>{c.discountValue ? <span className="badge badge-orange">{c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : `₼${c.discountValue}`}</span> : '—'}</td>
                                <td style={{ fontSize: '0.85rem' }}>{c.startDate ? new Date(c.startDate).toLocaleDateString('az') : '—'}</td>
                                <td style={{ fontSize: '0.85rem' }}>{c.endDate ? new Date(c.endDate).toLocaleDateString('az') : '—'}</td>
                                <td>
                                    <button 
                                        onClick={() => handleToggleActive(c.id, c.isActive)}
                                        disabled={actionId === c.id}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                                        title={c.isActive ? 'Deaktiv et' : 'Aktiv et'}
                                    >
                                        <span className={`badge ${c.isActive ? 'badge-green' : 'badge-gray'}`}>
                                            {c.isActive ? 'Aktiv' : 'Deaktiv'}
                                        </span>
                                    </button>
                                </td>
                                <td>
                                    <div className="action-cell">
                                        <button className="icon-btn" onClick={() => setModal(c)} title="Redaktə et"><Edit2 size={16} /></button>
                                        <button className="icon-btn danger" onClick={() => handleDelete(c.id)} disabled={actionId === c.id} title="Sil"><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {modal && <CampaignModal initial={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSave={fetchCampaigns} />}
        </div>
    );
};

export default Campaigns;
