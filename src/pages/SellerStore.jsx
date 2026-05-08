import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Calendar, ShoppingBag, Star, ShieldCheck, ChevronRight } from 'lucide-react';
import api from '../api/axios';

const SellerStore = () => {
    const { id } = useParams();
    const [seller, setSeller] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStoreData = async () => {
            try {
                setLoading(true);
                // Fetch seller profile
                const sellerRes = await api.get(`/seller/profile/${id}`);
                setSeller(sellerRes.data.data);

                // Fetch seller products
                const productsRes = await api.get(`/user/${id}/product`, {
                    params: { size: 50 }
                });
                setProducts(productsRes.data?.data?.content || []);
            } catch (err) {
                console.error("Store data error:", err);
                setError("Mağaza məlumatları yüklənərkən xəta baş verdi.");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchStoreData();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="container" style={{ padding: '5rem 20px', textAlign: 'center' }}>
                <p>Yüklənir...</p>
            </div>
        );
    }

    if (error || !seller) {
        return (
            <div className="container" style={{ padding: '5rem 20px', textAlign: 'center' }}>
                <p style={{ color: '#ef4444' }}>{error || "Satıcı tapılmadı."}</p>
                <Link to="/" style={{ color: 'var(--primary)', fontWeight: 600 }}>Ana səhifəyə qayıt</Link>
            </div>
        );
    }

    const sellerName = seller.name || "Satıcı";
    const bannerUrl = seller.bannerImageUrl;
    const profileUrl = seller.profileImageUrl;

    return (
        <div className="store-page">
            {/* Banner Section */}
            <div className="store-header">
                <div 
                    className="store-banner"
                    style={{ 
                        backgroundImage: bannerUrl ? `url(${bannerUrl})` : 'linear-gradient(135deg, #127749, #af862f)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                >
                    <div className="banner-overlay" />
                </div>
                
                <div className="container store-profile-container">
                    <div className="store-profile-card glass">
                        <div className="store-avatar-container">
                            <div className="store-avatar">
                                {profileUrl ? (
                                    <img src={profileUrl} alt={sellerName} />
                                ) : (
                                    sellerName.substring(0, 2).toUpperCase()
                                )}
                            </div>
                        </div>
                        <div className="store-meta">
                            <h1 className="store-name">{sellerName}</h1>
                            <div className="store-badges">
                                <span className="badge-item"><ShieldCheck size={14} /> Təsdiqlənmiş Mağaza</span>
                                <span className="badge-item"><Star size={14} /> 4.8 Reytinq</span>
                            </div>
                            <div className="store-details">
                                <span><MapPin size={16} /> Bakı, Azərbaycan</span>
                                <span><Calendar size={16} /> 2024-cü ildən fəaliyyətdə</span>
                            </div>
                        </div>
                        <div className="store-actions">
                            <button className="btn-primary">Mağazanı İzlə</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Products Section */}
            <div className="container" style={{ padding: '3rem 20px' }}>
                <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Məhsullar ({products.length})</h2>
                    <div className="filter-hint" style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
                        Bütün elanlar göstərilir
                    </div>
                </div>

                {products.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem', background: 'rgba(0,0,0,0.02)', borderRadius: '20px' }}>
                        <ShoppingBag size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p style={{ color: 'var(--text-light)' }}>Bu satıcının hələ heç bir məhsulu yoxdur.</p>
                    </div>
                ) : (
                    <div className="store-products-grid">
                        {products.map((product) => (
                            <motion.div 
                                key={product.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="store-product-card"
                            >
                                <Link to={`/product/${product.id}`} className="product-link">
                                    <div className="product-image">
                                        <img src={product.imageUrls?.[0] || 'https://via.placeholder.com/300x300?text=No+Image'} alt={product.title} />
                                        {product.isNew && <span className="tag-new">Yeni</span>}
                                    </div>
                                    <div className="product-content">
                                        <h3 className="product-title">{product.title}</h3>
                                        <div className="product-price">{product.price} ₼</div>
                                        <div className="product-footer">
                                            <span>{product.city || 'Bakı'}</span>
                                            <ChevronRight size={14} />
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                .store-header {
                    position: relative;
                    margin-bottom: 5rem;
                }
                .store-banner {
                    height: 300px;
                    width: 100%;
                    position: relative;
                }
                .banner-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to bottom, transparent, rgba(0,0,0,0.3));
                }
                .store-profile-container {
                    position: relative;
                    margin-top: -60px;
                    z-index: 10;
                }
                .store-profile-card {
                    display: flex;
                    align-items: center;
                    padding: 2rem;
                    border-radius: 24px;
                    gap: 2rem;
                    background: rgba(255, 255, 255, 0.95);
                    box-shadow: 0 10px 40px rgba(0,0,0,0.1);
                }
                .store-avatar-container {
                    flex-shrink: 0;
                }
                .store-avatar {
                    width: 120px;
                    height: 120px;
                    border-radius: 24px;
                    background: var(--primary);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2.5rem;
                    font-weight: 800;
                    overflow: hidden;
                    border: 4px solid white;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                }
                .store-avatar img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .store-meta {
                    flex: 1;
                }
                .store-name {
                    font-size: 2.2rem;
                    font-weight: 900;
                    margin-bottom: 0.5rem;
                    color: var(--text);
                }
                .store-badges {
                    display: flex;
                    gap: 0.75rem;
                    margin-bottom: 1rem;
                }
                .badge-item {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 0.8rem;
                    font-weight: 700;
                    padding: 4px 12px;
                    border-radius: 999px;
                    background: rgba(18,119,73,0.1);
                    color: var(--primary);
                }
                .store-details {
                    display: flex;
                    gap: 1.5rem;
                    color: var(--text-light);
                    font-size: 0.9rem;
                }
                .store-details span {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .store-products-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
                    gap: 1.5rem;
                }
                .store-product-card {
                    background: white;
                    border-radius: 16px;
                    overflow: hidden;
                    border: 1px solid var(--border);
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .store-product-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 25px rgba(0,0,0,0.08);
                }
                .product-link {
                    text-decoration: none;
                    color: inherit;
                }
                .product-image {
                    height: 200px;
                    position: relative;
                    overflow: hidden;
                }
                .product-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .tag-new {
                    position: absolute;
                    top: 10px;
                    left: 10px;
                    background: var(--primary);
                    color: white;
                    font-size: 0.7rem;
                    font-weight: 700;
                    padding: 3px 10px;
                    border-radius: 6px;
                }
                .product-content {
                    padding: 1.25rem;
                }
                .product-title {
                    font-size: 1.1rem;
                    font-weight: 700;
                    margin-bottom: 0.5rem;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .product-price {
                    font-size: 1.4rem;
                    font-weight: 900;
                    color: var(--primary);
                    margin-bottom: 1rem;
                }
                .product-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 0.85rem;
                    color: var(--text-light);
                }
                @media (max-width: 768px) {
                    .store-profile-card {
                        flex-direction: column;
                        text-align: center;
                        padding: 1.5rem;
                    }
                    .store-badges {
                        justify-content: center;
                    }
                    .store-details {
                        flex-direction: column;
                        gap: 0.5rem;
                        align-items: center;
                    }
                    .store-name {
                        font-size: 1.8rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default SellerStore;
