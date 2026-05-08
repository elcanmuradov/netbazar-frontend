import React, { useState, useEffect, useCallback } from 'react';
import { Image, Plus, Trash2, Edit2, X } from 'lucide-react';
import RefreshBtn from '../../components/admin/RefreshBtn';
import api from '../../api/axios';
import './AdminShared.css';

const EMPTY = { title: '', imageUrl: '', linkUrl: '', placement: 'home', sortOrder: 0, isActive: true, startDate: '', endDate: '' };

const BannerModal = ({ initial, onClose, onSave }) => {
    const [form, setForm] = useState(initial || EMPTY);
    const [saving, setSaving] = useState(false);
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const handleSave = async () => {
        if (!form.title || !form.imageUrl) return alert('Başlıq və şəkil URL tələb olunur');
        setSaving(true);
        try {
            if (initial?.id) await api.put(`/admin/banners/${initial.id}`, form);
            else await api.post('/admin/banners', form);
            onSave(); onClose();
        } catch { alert('Xəta'); } finally { setSaving(false); }
    };
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{initial?.id ? 'Banneri Redaktə Et' : 'Yeni Banner'}</h3>
                    <button className="icon-btn" onClick={onClose}><X size={18} /></button>
                </div>
                <div className="modal-body">
                    <div className="form-group"><label>Başlıq *</label><input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Yay endirimi" /></div>
                    <div className="form-group"><label>Şəkil URL *</label><input value={form.imageUrl} onChange={e => set('imageUrl', e.target.value)} placeholder="https://..." /></div>
                    <div className="form-group"><label>Link URL</label><input value={form.linkUrl} onChange={e => set('linkUrl', e.target.value)} placeholder="https://..." /></div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Yerləşmə</label>
                            <select value={form.placement} onChange={e => set('placement', e.target.value)}>
                                <option value="home">Ana səhifə</option>
                                <option value="category">Kateqoriya</option>
                                <option value="product">Məhsul</option>
                            </select>
                        </div>
                        <div className="form-group"><label>Sıra</label><input type="number" value={form.sortOrder} onChange={e => set('sortOrder', parseInt(e.target.value))} /></div>
                    </div>
                    <div className="form-row">
                        <div className="form-group"><label>Başlama tarixi</label><input type="datetime-local" value={form.startDate} onChange={e => set('startDate', e.target.value)} /></div>
                        <div className="form-group"><label>Bitmə tarixi</label><input type="datetime-local" value={form.endDate} onChange={e => set('endDate', e.target.value)} /></div>
                    </div>
                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} />
                            Aktiv
                        </label>
                    </div>
                    {form.imageUrl && <img src={form.imageUrl} alt="preview" style={{ width: '100%', borderRadius: '0.75rem', maxHeight: 160, objectFit: 'cover', marginTop: '0.5rem' }} onError={e => e.target.style.display = 'none'} />}
                </div>
                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose}>Ləğv et</button>
                    <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saxlanır...' : 'Saxla'}</button>
                </div>
            </div>
        </div>
    );
};

const Banners = () => {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null); // null | 'new' | banner object
    const [actionId, setActionId] = useState(null);

    const fetchBanners = useCallback(async () => {
        setLoading(true);
        try { const res = await api.get('/admin/banners'); setBanners(res.data.data || []); }
        catch { console.error('Banners fetch error'); } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchBanners(); }, [fetchBanners]);

    const handleDelete = async (id) => {
        if (!window.confirm('Bu banneri silmək istəyirsiniz?')) return;
        setActionId(id);
        try { await api.delete(`/admin/banners/${id}`); await fetchBanners(); }
        catch { alert('Xəta'); } finally { setActionId(null); }
    };

    if (loading) return <div className="loading-state">Bannerlər yüklənir...</div>;

    return (
        <div className="admin-page">
            <header className="page-header">
                <div>
                    <h1>Banner Meneceri</h1>
                    <p>Ana səhifə, kateqoriya və məhsul bannerlərini idarə et</p>
                </div>
                <div className="header-actions">
                    <RefreshBtn onClick={fetchBanners} />
                    <button className="btn-primary" onClick={() => setModal('new')}><Plus size={16} />Yeni banner</button>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {banners.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: 'var(--text-light)' }}>Banner tapılmadı.</div>
                ) : banners.map((b, i) => (
                    <div key={b.id} className="glass animate-fade-in" style={{ borderRadius: '1.25rem', overflow: 'hidden', animationDelay: `${i * 0.05}s` }}>
                        <div style={{ position: 'relative', height: 160, background: 'var(--bg)' }}>
                            {b.imageUrl ? (
                                <img src={b.imageUrl} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-light)' }}><Image size={40} /></div>
                            )}
                            <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', display: 'flex', gap: '0.4rem' }}>
                                <button className="icon-btn" style={{ background: 'white' }} onClick={() => setModal(b)}><Edit2 size={14} /></button>
                                <button className="icon-btn danger" style={{ background: 'white' }} onClick={() => handleDelete(b.id)} disabled={actionId === b.id}><Trash2 size={14} /></button>
                            </div>
                            <span className={`badge ${b.isActive ? 'badge-green' : 'badge-gray'}`} style={{ position: 'absolute', bottom: '0.75rem', left: '0.75rem' }}>{b.isActive ? 'Aktiv' : 'Deaktiv'}</span>
                        </div>
                        <div style={{ padding: '1rem 1.25rem' }}>
                            <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{b.title}</div>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <span className="badge badge-blue">{b.placement}</span>
                                <span className="badge badge-gray">Sıra: {b.sortOrder}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {modal && <BannerModal initial={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSave={fetchBanners} />}
        </div>
    );
};

export default Banners;
