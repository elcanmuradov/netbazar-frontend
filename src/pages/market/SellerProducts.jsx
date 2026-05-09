import React, { useState, useEffect, useContext, useCallback } from 'react';
import { ShoppingBag, Plus, Edit2, Trash2, Search } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import RefreshBtn from '../../components/admin/RefreshBtn';
import api from '../../api/axios';
import './SellerDashboard.css';
import './SellerProducts.css';

const SellerProducts = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [deletingId, setDeletingId] = useState(null);

    const fetchProducts = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const res = await api.get(`/user/${user.id}/product`, { params: { size: 100 } });
            let productsData = res.data?.data?.content || [];
            
            // Əgər yeni məhsul əlavə edildisə, optimistic product'ı önə əlavə et
            if (location.state?.optimisticProduct) {
                const optimistic = location.state.optimisticProduct;
                // Mövcud olmayan ürünü ilk başa koy
                if (!productsData.find(p => p.id === optimistic.id)) {
                    productsData = [optimistic, ...productsData];
                }
            }
            
            setProducts(productsData);
        } catch (e) {
            console.error('Products fetch error', e);
        } finally {
            setLoading(false);
        }
    }, [user?.id, location.state?.optimisticProduct]);

    useEffect(() => { 
        fetchProducts();
        // Yeni ürün əlavə edildisə, 2 saniyə sonra API'dən yenile
        if (location.state?.optimisticProduct) {
            const timer = setTimeout(() => fetchProducts(), 2000);
            return () => clearTimeout(timer);
        }
    }, [fetchProducts, location.state?.optimisticProduct]);

    const handleDelete = async (productId) => {
        if (!window.confirm('Bu məhsulu silmək istədiyinizə əminsiniz?')) return;
        setDeletingId(productId);
        try {
            await api.delete(`/user/${user.id}/product/${productId}/delete`);
            setProducts(prev => prev.filter(p => p.id !== productId));
        } catch { alert('Silinmə zamanı xəta baş verdi'); }
        finally { setDeletingId(null); }
    };

    const filtered = products.filter(p =>
        (p.title || '').toLowerCase().includes(search.toLowerCase())
    );

    const active = products.filter(p => p.status === 'ACTIVE').length;

    if (loading) return <div className="seller-loading">Məhsullar yüklənir...</div>;

    return (
        <div className="seller-page">
            <div className="seller-orders-header">
                <div className="seller-page-header" style={{ marginBottom: 0 }}>
                    <h1>Məhsullarım</h1>
                    <p>{active} aktiv · {products.length} ümumi</p>
                </div>
                <div className="seller-orders-actions">
                    <div className="seller-search-bar">
                        <Search size={15} />
                        <input
                            placeholder="Məhsul axtar..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <RefreshBtn onClick={fetchProducts} />
                    <button className="soc-action-btn" onClick={() => navigate('/add-product')}>
                        <Plus size={15} style={{ marginRight: 4 }} />
                        Yeni məhsul
                    </button>
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="seller-empty-state glass">
                    <ShoppingBag size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                    <p>Məhsul tapılmadı.</p>
                    <button className="soc-action-btn" style={{ marginTop: '1rem' }} onClick={() => navigate('/add-product')}>
                        İlk məhsulunuzu əlavə edin
                    </button>
                </div>
            ) : (
                <div className="seller-products-grid">
                    {filtered.map((p, i) => (
                        <div key={p.id} className="seller-product-card glass animate-fade-in" style={{ animationDelay: `${i * 0.03}s` }}>
                            <div className="spc-image">
                                {p.imageUrls?.[0] ? (
                                    <img src={p.imageUrls[0]} alt={p.title} />
                                ) : (
                                    <div className="spc-no-image"><ShoppingBag size={32} /></div>
                                )}
                                <span className={`spc-status-badge ${p.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                                    {p.status === 'ACTIVE' ? 'Aktiv' : p.status}
                                </span>
                            </div>
                            <div className="spc-body">
                                <h4 className="spc-title">{p.title}</h4>
                                <div className="spc-meta">
                                    <span>{p.category}</span>
                                    <span>{p.city}</span>
                                </div>
                                <div className="spc-footer">
                                    <span className="spc-price">₼{parseFloat(p.price || 0).toFixed(2)}</span>
                                    <div className="spc-actions">
                                        <Link to={`/edit-product/${p.id}`} className="spc-btn edit" title="Redaktə et">
                                            <Edit2 size={15} />
                                        </Link>
                                        <button
                                            className="spc-btn delete"
                                            title="Sil"
                                            onClick={() => handleDelete(p.id)}
                                            disabled={deletingId === p.id}
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SellerProducts;
