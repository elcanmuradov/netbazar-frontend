import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Plus, Trash2, Edit2, X, Search } from 'lucide-react';
import RefreshBtn from '../../components/admin/RefreshBtn';
import api from '../../api/axios';
import './AdminShared.css';

const EMPTY = { title: '', slug: '', content: '', coverImageUrl: '', categoryName: '', status: 'DRAFT', scheduledAt: '', metaTitle: '', metaDescription: '' };

const slugify = (s) => s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

const BlogModal = ({ initial, onClose, onSave }) => {
    const [form, setForm] = useState(initial || EMPTY);
    const [saving, setSaving] = useState(false);
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const handleSave = async () => {
        if (!form.title || !form.slug) return alert('Başlıq və slug tələb olunur');
        setSaving(true);
        try {
            if (initial?.id) await api.put(`/admin/blog/${initial.id}`, form);
            else await api.post('/admin/blog', form);
            onSave(); onClose();
        } catch { alert('Xəta'); } finally { setSaving(false); }
    };
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{initial?.id ? 'Yazını Redaktə Et' : 'Yeni Yazı'}</h3>
                    <button className="icon-btn" onClick={onClose}><X size={18} /></button>
                </div>
                <div className="modal-body">
                    <div className="form-group">
                        <label>Başlıq *</label>
                        <input value={form.title} onChange={e => { set('title', e.target.value); if (!initial?.id) set('slug', slugify(e.target.value)); }} placeholder="Yazı başlığı" />
                    </div>
                    <div className="form-row">
                        <div className="form-group"><label>Slug *</label><input value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="yazi-basligi" /></div>
                        <div className="form-group"><label>Kateqoriya</label><input value={form.categoryName} onChange={e => set('categoryName', e.target.value)} placeholder="Texnologiya" /></div>
                    </div>
                    <div className="form-group"><label>Məzmun</label><textarea value={form.content} onChange={e => set('content', e.target.value)} style={{ minHeight: 140 }} placeholder="Yazı məzmunu..." /></div>
                    <div className="form-group"><label>Örtük şəkil URL</label><input value={form.coverImageUrl} onChange={e => set('coverImageUrl', e.target.value)} placeholder="https://..." /></div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Status</label>
                            <select value={form.status} onChange={e => set('status', e.target.value)}>
                                <option value="DRAFT">Qaralama</option>
                                <option value="PUBLISHED">Dərc edilmiş</option>
                                <option value="SCHEDULED">Planlaşdırılmış</option>
                            </select>
                        </div>
                        <div className="form-group"><label>Planlaşdırılma tarixi</label><input type="datetime-local" value={form.scheduledAt} onChange={e => set('scheduledAt', e.target.value)} /></div>
                    </div>
                    <div className="form-group"><label>Meta başlıq</label><input value={form.metaTitle} onChange={e => set('metaTitle', e.target.value)} /></div>
                    <div className="form-group"><label>Meta açıqlama</label><textarea value={form.metaDescription} onChange={e => set('metaDescription', e.target.value)} style={{ minHeight: 60 }} /></div>
                </div>
                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose}>Ləğv et</button>
                    <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saxlanır...' : 'Saxla'}</button>
                </div>
            </div>
        </div>
    );
};

const Blog = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState(null);
    const [actionId, setActionId] = useState(null);

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try { const res = await api.get('/admin/blog'); setPosts(res.data.data || []); }
        catch { console.error('Blog fetch error'); } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchPosts(); }, [fetchPosts]);

    const handleDelete = async (id) => {
        if (!window.confirm('Bu yazını silmək istəyirsiniz?')) return;
        setActionId(id);
        try { await api.delete(`/admin/blog/${id}`); await fetchPosts(); }
        catch { alert('Xəta'); } finally { setActionId(null); }
    };

    const filtered = posts.filter(p => p.title?.toLowerCase().includes(search.toLowerCase()));
    const statusBadge = (s) => ({ DRAFT: 'badge-gray', PUBLISHED: 'badge-green', SCHEDULED: 'badge-blue' }[s] || 'badge-gray');

    if (loading) return <div className="loading-state">Blog yazıları yüklənir...</div>;

    return (
        <div className="admin-page">
            <header className="page-header">
                <div>
                    <h1>Blog / Xəbərlər</h1>
                    <p>Yazılar, kateqoriyalar və dərc idarəetmə</p>
                </div>
                <div className="header-actions">
                    <div className="search-bar"><Search size={16} /><input placeholder="Yazı axtar..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                    <RefreshBtn onClick={fetchPosts} />
                    <button className="btn-primary" onClick={() => setModal('new')}><Plus size={16} />Yeni yazı</button>
                </div>
            </header>

            <div className="mini-stats">
                <div className="mini-stat-card"><div className="mini-stat-icon blue"><FileText size={20} /></div><div><div className="mini-stat-label">Ümumi</div><div className="mini-stat-value">{posts.length}</div></div></div>
                <div className="mini-stat-card"><div className="mini-stat-icon green"><FileText size={20} /></div><div><div className="mini-stat-label">Dərc edilmiş</div><div className="mini-stat-value">{posts.filter(p => p.status === 'PUBLISHED').length}</div></div></div>
                <div className="mini-stat-card"><div className="mini-stat-icon gray"><FileText size={20} /></div><div><div className="mini-stat-label">Qaralama</div><div className="mini-stat-value">{posts.filter(p => p.status === 'DRAFT').length}</div></div></div>
            </div>

            <div className="table-wrapper glass">
                <table className="admin-table">
                    <thead>
                        <tr><th>Başlıq</th><th>Kateqoriya</th><th>Status</th><th>Tarix</th><th></th></tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan="5" className="empty-row">Yazı tapılmadı.</td></tr>
                        ) : filtered.map((p, i) => (
                            <tr key={p.id} className="animate-fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        {p.coverImageUrl && <img src={p.coverImageUrl} alt="" style={{ width: 44, height: 44, borderRadius: '0.6rem', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />}
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{p.title}</div>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>{p.slug}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>{p.categoryName ? <span className="badge badge-blue">{p.categoryName}</span> : '—'}</td>
                                <td><span className={`badge ${statusBadge(p.status)}`}>{p.status}</span></td>
                                <td style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>{p.createdAt ? new Date(p.createdAt).toLocaleDateString('az') : '—'}</td>
                                <td>
                                    <div className="action-cell">
                                        <button className="icon-btn" onClick={() => setModal(p)}><Edit2 size={16} /></button>
                                        <button className="icon-btn danger" onClick={() => handleDelete(p.id)} disabled={actionId === p.id}><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {modal && <BlogModal initial={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSave={fetchPosts} />}
        </div>
    );
};

export default Blog;
