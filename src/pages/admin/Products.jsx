import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingBag, Search, Trash2, ShieldAlert, CheckCircle2, ExternalLink } from 'lucide-react';
import RefreshBtn from '../../components/admin/RefreshBtn';
import { useToast } from '../../components/Toast/ToastContext';
import api from '../../api/axios';
import './Products.css';

const Products = () => {
    const toast = useToast();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('reported');
    const [actionLoadingId, setActionLoadingId] = useState(null);

    const fetchProducts = useCallback(async (mode) => {
        setLoading(true);
        try {
            const endpoint = mode === 'reported' ? '/all-reported' : '/all';
            const response = await api.get(endpoint);
            const payload = response.data.data;
            let list = Array.isArray(payload) ? payload : (payload?.content || []);
            if (mode === 'reported') {
                list = list.filter(p => p.isReported === true || p.reportCount > 0);
            }
            setProducts(list);
        } catch (error) {
            console.error("Error fetching products", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchProducts(viewMode); }, [fetchProducts, viewMode]);

    const handleDelete = async (product) => {
        if (!window.confirm(viewMode === 'reported' ? 'Bu şikayət edilmiş məhsulu silmək istəyirsiniz?' : 'Bu məhsulu silmək istəyirsiniz?')) return;
        const reasonInput = window.prompt('Silinmə səbəbini yazın:', 'Qayda pozuntusu');
        if (reasonInput === null) return;
        const reason = reasonInput.trim() || 'Qayda pozuntusu';
        try {
            setActionLoadingId(product.id);
            await api.delete(`/user/delete-from-db/${product.id}`, { params: { reason } });
            setProducts(prev => prev.filter(p => p.id !== product.id));
            toast.success('Məhsul uğurla silindi');
        } catch (error) {
            console.error("Error deleting product", error);
            toast.error('Məhsul silinə bilmədi');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleMarkResolved = async (product) => {
        if (!window.confirm('Bu şikayəti həll edilmiş kimi işarələmək istəyirsiniz?')) return;
        try {
            setActionLoadingId(product.id);
            await api.post(`/user/${product.userId}/product/${product.id}/mark-resolved`);
            toast.success('Şikayət həll edildi');
            await fetchProducts(viewMode);
        } catch (error) {
            console.error("Error resolving product report", error);
            toast.error('Şikayət həll edilə bilmədi');
        } finally {
            setActionLoadingId(null);
        }
    };

    const filteredProducts = products.filter(p =>
        p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="loading-state">Loading inventory...</div>;

    return (
        <div className="admin-products-container">
            <header className="page-header">
                <div>
                    <h1>Product Moderation</h1>
                    <p>Review reported listings, resolve cases, or remove products from the platform.</p>
                </div>
                <div className="header-actions">
                    <div className="search-bar">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search by title or description..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <RefreshBtn onClick={() => fetchProducts(viewMode)} />
                </div>
            </header>

            <div className="filter-tabs product-tabs">
                <button className={viewMode === 'reported' ? 'active' : ''} onClick={() => setViewMode('reported')}>
                    <ShieldAlert size={16} />
                    Reported Listings
                </button>
                <button className={viewMode === 'all' ? 'active' : ''} onClick={() => setViewMode('all')}>
                    <CheckCircle2 size={16} />
                    All Listings
                </button>
            </div>

            <div className="product-table-wrapper glass">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Product Info</th>
                            <th>Status</th>
                            <th>Price/Value</th>
                            <th>Provider Email</th>
                            <th>Moderation</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="empty-table-row">No products found.</td>
                            </tr>
                        ) : (
                            filteredProducts.map((p, index) => (
                                <tr key={p.id || index} className="table-row animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                                    <td className="p-info-td">
                                        <div className="p-cell-content">
                                            {p.imageUrls && p.imageUrls[0] ? (
                                                <img src={p.imageUrls[0]} alt={p.title} className="p-thumb" />
                                            ) : (
                                                <div className="p-thumb-placeholder"><ShoppingBag size={20} /></div>
                                            )}
                                            <div className="p-text">
                                                <div className="name-row">
                                                    <strong>{p.title}</strong>
                                                    <a href={`/product/${p.id}`} target="_blank" rel="noopener noreferrer"><ExternalLink size={12} /></a>
                                                </div>
                                                <span className="p-category">{p.category || 'General'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge-status ${p.status?.toLowerCase() || 'active'}`}>
                                            {p.status || 'ACTIVE'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="p-value">
                                            <span>₼{p.price || '0.00'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="provider-email">{p.userEmail || 'N/A'}</span>
                                    </td>
                                    <td>
                                        <span className={`badge-status ${viewMode === 'reported' ? 'deleted' : 'active'}`}>
                                            {viewMode === 'reported' ? 'Reported for review' : 'Visible in catalog'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-cell">
                                            <button
                                                className="icon-btn danger"
                                                onClick={() => handleDelete(p)}
                                                title="Delete Listing"
                                                disabled={actionLoadingId === p.id}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                            {viewMode === 'reported' && (
                                                <button
                                                    className="icon-btn success"
                                                    onClick={() => handleMarkResolved(p)}
                                                    title="Mark Resolved"
                                                    disabled={actionLoadingId === p.id}
                                                >
                                                    <CheckCircle2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Products;