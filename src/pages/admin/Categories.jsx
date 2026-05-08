import React, { useState, useEffect, useCallback } from 'react';
import { Grid, Plus, Trash2, Edit2, X, ChevronRight } from 'lucide-react';
import RefreshBtn from '../../components/admin/RefreshBtn';
import api from '../../api/axios';
import './AdminShared.css';

const EMPTY = { name: '', slug: '', iconUrl: '', parentId: '', sortOrder: 0, isActive: true, metaTitle: '', metaDescription: '' };
const slugify = (s) => s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

const CategoryModal = ({ initial, categories, onClose, onSave }) => {
    const [form, setForm] = useState(initial || EMPTY);
    const [saving, setSaving] = useState(false);
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const topLevel = categories.filter(c => !c.parentId);
    const handleSave = async () => {
        if (!form.name || !form.slug) return alert('Ad və slug tələb olunur');
        setSaving(true);
        try {
            const payload = { ...form, parentId: form.parentId || null };
            if (initial?.id) await api.put(`/admin/categories/${initial.id}`, payload);
            else await api.post('/admin/categories', payload);
            onSave(); onClose();
        } catch { alert('Xəta'); } finally { setSaving(false); }
    };
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{initial?.id ? 'Kateqoriyanı Redaktə Et' : 'Yeni Kateqoriya'}</h3>
                    <button className="icon-btn" onClick={onClose}><X size={18} /></button>
                </div>
                <div className="modal-body">
                    <div className="form-row">
                        <div className="form-group">
                            <label>Ad *</label>
                            <input value={form.name} onChange={e => { set('name', e.target.value); if (!initial?.id) set('slug', slugify(e.target.value)); }} />
                        </div>
                        <div className="form-group"><label>Slug *</label><input value={form.slug} onChange={e => set('slug', e.target.value)} /></div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Üst kateqoriya (boş = əsas)</label>
                            <select value={form.parentId} onChange={e => set('parentId', e.target.value)}>
                                <option value="">— Əsas kateqoriya —</option>
                                {topLevel.filter(c => c.id !== initial?.id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group"><label>Sıra</label><input type="number" value={form.sortOrder} onChange={e => set('sortOrder', parseInt(e.target.value))} /></div>
                    </div>
                    <div className="form-group"><label>İkon URL</label><input value={form.iconUrl} onChange={e => set('iconUrl', e.target.value)} placeholder="https://..." /></div>
                    <div className="form-group"><label>Meta başlıq</label><input value={form.metaTitle} onChange={e => set('metaTitle', e.target.value)} /></div>
                    <div className="form-group"><label>Meta açıqlama</label><textarea value={form.metaDescription} onChange={e => set('metaDescription', e.target.value)} style={{ minHeight: 60 }} /></div>
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

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null);
    const [actionId, setActionId] = useState(null);
    const [expanded, setExpanded] = useState(null);

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        try { const res = await api.get('/admin/categories'); setCategories(res.data.data || []); }
        catch { console.error('Categories fetch error'); } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchCategories(); }, [fetchCategories]);

    const handleDelete = async (id) => {
        if (!window.confirm('Bu kateqoriyanı silmək istəyirsiniz?')) return;
        setActionId(id);
        try { await api.delete(`/admin/categories/${id}`); await fetchCategories(); }
        catch { alert('Xəta'); } finally { setActionId(null); }
    };

    const topLevel = categories.filter(c => !c.parentId);
    const children = (parentId) => categories.filter(c => c.parentId === parentId);

    if (loading) return <div className="loading-state">Kateqoriyalar yüklənir...</div>;

    return (
        <div className="admin-page">
            <header className="page-header">
                <div>
                    <h1>Kateqoriya İdarəetmə</h1>
                    <p>Əsas və alt kateqoriyalar, SEO meta məlumatları</p>
                </div>
                <div className="header-actions">
                    <RefreshBtn onClick={fetchCategories} />
                    <button className="btn-primary" onClick={() => setModal('new')}><Plus size={16} />Yeni kateqoriya</button>
                </div>
            </header>

            <div className="mini-stats">
                <div className="mini-stat-card"><div className="mini-stat-icon blue"><Grid size={20} /></div><div><div className="mini-stat-label">Ümumi</div><div className="mini-stat-value">{categories.length}</div></div></div>
                <div className="mini-stat-card"><div className="mini-stat-icon green"><Grid size={20} /></div><div><div className="mini-stat-label">Əsas</div><div className="mini-stat-value">{topLevel.length}</div></div></div>
                <div className="mini-stat-card"><div className="mini-stat-icon purple"><Grid size={20} /></div><div><div className="mini-stat-label">Alt kateqoriya</div><div className="mini-stat-value">{categories.filter(c => c.parentId).length}</div></div></div>
            </div>

            <div className="table-wrapper glass">
                <table className="admin-table">
                    <thead>
                        <tr><th>Ad</th><th>Slug</th><th>Sıra</th><th>Status</th><th>Alt kateqoriyalar</th><th></th></tr>
                    </thead>
                    <tbody>
                        {topLevel.length === 0 ? (
                            <tr><td colSpan="6" className="empty-row">Kateqoriya tapılmadı.</td></tr>
                        ) : topLevel.map((c, i) => {
                            const subs = children(c.id);
                            return (
                                <React.Fragment key={c.id}>
                                    <tr className="animate-fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                {c.iconUrl && <img src={c.iconUrl} alt="" style={{ width: 32, height: 32, borderRadius: '0.5rem', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />}
                                                <span style={{ fontWeight: 600 }}>{c.name}</span>
                                            </div>
                                        </td>
                                        <td style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-light)' }}>{c.slug}</td>
                                        <td>{c.sortOrder}</td>
                                        <td>{c.isActive ? <span className="badge badge-green">Aktiv</span> : <span className="badge badge-gray">Deaktiv</span>}</td>
                                        <td>
                                            {subs.length > 0 && (
                                                <button style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--accent)', fontWeight: 600, fontSize: '0.85rem' }} onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
                                                    <ChevronRight size={14} style={{ transform: expanded === c.id ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                                                    {subs.length} alt
                                                </button>
                                            )}
                                        </td>
                                        <td>
                                            <div className="action-cell">
                                                <button className="icon-btn" onClick={() => setModal(c)}><Edit2 size={15} /></button>
                                                <button className="icon-btn danger" onClick={() => handleDelete(c.id)} disabled={actionId === c.id}><Trash2 size={15} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                    {expanded === c.id && subs.map(sub => (
                                        <tr key={sub.id} style={{ background: 'rgba(18,119,73,0.02)' }}>
                                            <td style={{ paddingLeft: '3rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <ChevronRight size={12} style={{ color: 'var(--text-light)' }} />
                                                    <span style={{ fontWeight: 500 }}>{sub.name}</span>
                                                </div>
                                            </td>
                                            <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-light)' }}>{sub.slug}</td>
                                            <td>{sub.sortOrder}</td>
                                            <td>{sub.isActive ? <span className="badge badge-green">Aktiv</span> : <span className="badge badge-gray">Deaktiv</span>}</td>
                                            <td></td>
                                            <td>
                                                <div className="action-cell">
                                                    <button className="icon-btn" onClick={() => setModal(sub)}><Edit2 size={15} /></button>
                                                    <button className="icon-btn danger" onClick={() => handleDelete(sub.id)} disabled={actionId === sub.id}><Trash2 size={15} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {modal && <CategoryModal initial={modal === 'new' ? null : modal} categories={categories} onClose={() => setModal(null)} onSave={fetchCategories} />}
        </div>
    );
};

export default Categories;
