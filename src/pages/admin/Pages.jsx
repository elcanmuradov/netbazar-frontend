import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Plus, Edit2, X } from 'lucide-react';
import RefreshBtn from '../../components/admin/RefreshBtn';
import api from '../../api/axios';
import './AdminShared.css';

const SLUGS = ['about', 'faq', 'terms', 'privacy', 'delivery'];
const SLUG_LABELS = { about: 'Haqqımızda', faq: 'FAQ', terms: 'Şərtlər', privacy: 'Gizlilik', delivery: 'Çatdırılma' };

const PageModal = ({ initial, onClose, onSave }) => {
    const [form, setForm] = useState(initial || { slug: '', title: '', content: '', metaTitle: '', metaDescription: '', isPublished: true });
    const [saving, setSaving] = useState(false);
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const handleSave = async () => {
        if (!form.slug || !form.title) return alert('Slug və başlıq tələb olunur');
        setSaving(true);
        try {
            if (initial?.id) await api.put(`/admin/pages/${initial.slug}`, form);
            else await api.post('/admin/pages', form);
            onSave(); onClose();
        } catch { alert('Xəta'); } finally { setSaving(false); }
    };
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{initial?.id ? 'Səhifəni Redaktə Et' : 'Yeni Səhifə'}</h3>
                    <button className="icon-btn" onClick={onClose}><X size={18} /></button>
                </div>
                <div className="modal-body">
                    <div className="form-row">
                        <div className="form-group">
                            <label>Slug *</label>
                            {initial?.id ? (
                                <input value={form.slug} disabled style={{ opacity: 0.6 }} />
                            ) : (
                                <select value={form.slug} onChange={e => set('slug', e.target.value)}>
                                    <option value="">Seçin...</option>
                                    {SLUGS.map(s => <option key={s} value={s}>{s} — {SLUG_LABELS[s]}</option>)}
                                </select>
                            )}
                        </div>
                        <div className="form-group"><label>Başlıq *</label><input value={form.title} onChange={e => set('title', e.target.value)} /></div>
                    </div>
                    <div className="form-group"><label>Məzmun (HTML dəstəklənir)</label><textarea value={form.content} onChange={e => set('content', e.target.value)} style={{ minHeight: 200, fontFamily: 'monospace', fontSize: '0.9rem' }} /></div>
                    <div className="form-group"><label>Meta başlıq</label><input value={form.metaTitle} onChange={e => set('metaTitle', e.target.value)} /></div>
                    <div className="form-group"><label>Meta açıqlama</label><textarea value={form.metaDescription} onChange={e => set('metaDescription', e.target.value)} style={{ minHeight: 60 }} /></div>
                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={form.isPublished} onChange={e => set('isPublished', e.target.checked)} />Dərc edilmiş
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

const Pages = () => {
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null);

    const fetchPages = useCallback(async () => {
        setLoading(true);
        try { const res = await api.get('/admin/pages'); setPages(res.data.data || []); }
        catch { console.error('Pages fetch error'); } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchPages(); }, [fetchPages]);

    if (loading) return <div className="loading-state">Səhifələr yüklənir...</div>;

    return (
        <div className="admin-page">
            <header className="page-header">
                <div>
                    <h1>Səhifə Redaktoru</h1>
                    <p>Haqqımızda, FAQ, Şərtlər, Gizlilik, Çatdırılma səhifələri</p>
                </div>
                <div className="header-actions">
                    <RefreshBtn onClick={fetchPages} />
                    <button className="btn-primary" onClick={() => setModal('new')}><Plus size={16} />Yeni səhifə</button>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {SLUGS.map(slug => {
                    const page = pages.find(p => p.slug === slug);
                    return (
                        <div key={slug} className="glass animate-fade-in" style={{ borderRadius: '1.25rem', padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)' }}>{SLUG_LABELS[slug]}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontFamily: 'monospace' }}>/{slug}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                    {page && <button className="icon-btn" onClick={() => setModal(page)}><Edit2 size={15} /></button>}
                                    {!page && <button className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => setModal({ slug, title: SLUG_LABELS[slug], content: '', metaTitle: '', metaDescription: '', isPublished: true })}><Plus size={14} />Yarat</button>}
                                </div>
                            </div>
                            {page ? (
                                <>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                                        {page.content?.replace(/<[^>]+>/g, '').slice(0, 100)}{page.content?.length > 100 ? '...' : ''}
                                    </div>
                                    <span className={`badge ${page.isPublished ? 'badge-green' : 'badge-gray'}`}>{page.isPublished ? 'Dərc edilmiş' : 'Gizli'}</span>
                                </>
                            ) : (
                                <div style={{ color: 'var(--text-light)', fontSize: '0.9rem', fontStyle: 'italic' }}>Hələ yaradılmayıb</div>
                            )}
                        </div>
                    );
                })}
            </div>

            {modal && <PageModal initial={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSave={fetchPages} />}
        </div>
    );
};

export default Pages;
