import React, { useState, useEffect, useContext } from 'react';
import { useToast } from '../components/Toast/ToastContext';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Share2, MapPin, Calendar, ShieldCheck, ChevronLeft, ChevronRight, MessageCircle, Package, Truck, ShieldAlert, Star, CreditCard, X, ShoppingBag, ShoppingCart, Plus, Minus } from 'lucide-react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';

const PRODUCT_PREVIEW_CACHE_KEY = 'productImagePreviewCache';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [product, setProduct] = useState(null);
    const [seller, setSeller] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [shareNotice, setShareNotice] = useState('');
    const [hasReported, setHasReported] = useState(false);
    const [isReporting, setIsReporting] = useState(false);
    const [reportToast, setReportToast] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
    const [reviewLoading, setReviewLoading] = useState(true);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [orderForm, setOrderForm] = useState({ paymentMethod: 'Kartla', deliveryCity: 'Bakı' });
    const [isOrderingAction, setIsOrderingAction] = useState(false);
    const [purchaseQuantity, setPurchaseQuantity] = useState(1);
    const [campaigns, setCampaigns] = useState([]);
    const { user, token } = useContext(AuthContext);
    const { addToCart } = useContext(CartContext);
    const toast = useToast();

    const actingUserId = user?.id || "00000000-0000-0000-0000-000000000000";

    const toBoolean = (value) => value === true || value === 'true' || value === 1;
    const statePreviewImages = Array.isArray(location.state?.previewImages) ? location.state.previewImages : [];

    const getCachedPreviewImages = (productId) => {
        const cache = JSON.parse(sessionStorage.getItem(PRODUCT_PREVIEW_CACHE_KEY) || '{}');
        const entry = cache?.[productId];
        if (!entry || !Array.isArray(entry.urls) || entry.urls.length === 0) return [];
        if (entry.expiresAt && entry.expiresAt <= Date.now()) return [];
        return entry.urls;
    };

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await api.get(`/user/${actingUserId}/product/${id}`);
                const productData = response.data.data;
                setProduct(productData);

                // Fetch seller details
                if (productData.userId) {
                    try {
                        const sellerRes = await api.get(`/seller/profile/${productData.userId}`);
                        setSeller(sellerRes.data.data || sellerRes.data);
                    } catch (err) {
                        console.error("Satıcı məlumatları tapılmadı", err);
                    }
                }
            } catch (error) {
                console.error("Məhsul detalları yüklənərkən xəta baş verdi:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProduct();
        }
    }, [id, actingUserId]);

    useEffect(() => {
        if (!product?.id) return;
        if (!Array.isArray(product.imageUrls) || product.imageUrls.length === 0) return;

        const cache = JSON.parse(sessionStorage.getItem(PRODUCT_PREVIEW_CACHE_KEY) || '{}');
        if (cache[product.id]) {
            delete cache[product.id];
            sessionStorage.setItem(PRODUCT_PREVIEW_CACHE_KEY, JSON.stringify(cache));
        }
    }, [product]);

    useEffect(() => {
        if (!reportToast) return;
        const timer = window.setTimeout(() => setReportToast(null), 3000);
        return () => window.clearTimeout(timer);
    }, [reportToast]);

    useEffect(() => {
        const fetchReviews = async () => {
            if (!id) return;

            setReviewLoading(true);
            try {
                const response = await api.get(`/product/${id}/reviews`);
                setReviews(response?.data?.data || []);
            } catch (error) {
                console.error('Rəylər yüklənərkən xəta baş verdi:', error);
                setReviews([]);
            } finally {
                setReviewLoading(false);
            }
        };

        fetchReviews();
    }, [id]);

    useEffect(() => {
        const fetchCampaigns = async () => {
            try {
                const res = await api.get('/campaigns');
                setCampaigns(res.data?.data || []);
            } catch (error) {
                console.error('Campaigns fetch error:', error);
            }
        };

        fetchCampaigns();
    }, []);

    const nextImage = () => {
        if (!product?.imageUrls?.length) return;
        setActiveImageIndex((prev) => (prev + 1) % product.imageUrls.length);
    };

    const prevImage = () => {
        if (!product?.imageUrls?.length) return;
        setActiveImageIndex((prev) => (prev - 1 + product.imageUrls.length) % product.imageUrls.length);
    };

    const [isFavorited, setIsFavorited] = useState(false);

    useEffect(() => {
        const checkFavoriteStatus = async () => {
            if (user && token) {
                try {
                    const res = await api.get('/profile/favorites');
                    const favorites = res.data.data || res.data || [];
                    setIsFavorited(favorites.includes(id));
                } catch (err) {
                    console.error("Favorit statusu yoxlanarkən xəta", err);
                }
            }
        };
        checkFavoriteStatus();
    }, [id, user, token]);

    const toggleFavorite = async () => {
        if (!user || !token) {
            navigate('/login');
            return;
        }

        try {
            if (isFavorited) {
                await api.delete(`/profile/favorites/${id}`);
            } else {
                await api.post(`/profile/favorites/${id}`);
            }
            setIsFavorited(!isFavorited);
        } catch (err) {
            console.error("Favorit statusu dəyişdirilərkən xəta", err);
        }
    };

    const handleChatClick = () => {
        if (!user || !token) {
            navigate('/login');
            return;
        }

        if (seller && product.userId !== user?.id) {
            navigate('/chat', {
                state: {
                    newChatUser: {
                        id: seller.id || product.userId,
                        name: seller.name || `İstifadəçi ${product.userId.substring(0, 5)}`
                    },
                    product: {
                        id: product.id,
                        title: product.title,
                        price: product.price,
                        imageUrl: images?.[0]
                    }
                }
            });
        } else if (user && product.userId === user.id) {
            toast.warning("Öz məhsulunuza mesaj yaza bilməzsiniz.");
        }
    };

    const copyTextToClipboard = async (text) => {
        if (navigator?.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return;
        }

        const input = document.createElement('input');
        input.value = text;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
    };

    const handleShareClick = async () => {
        const shareUrl = `${window.location.origin}/product/${id}`;

        try {
            await copyTextToClipboard(shareUrl);
            setShareNotice('Mehsul linki kopyalandi.');
        } catch (error) {
            console.error('Link kopyalanarken xeta bas verdi:', error);
            setShareNotice('Link kopyalanmadi. Yeniden cehd edin.');
        }

        window.setTimeout(() => setShareNotice(''), 2200);
    };

    const handleReportProduct = async () => {
        if (!user || !token) {
            navigate('/login');
            return;
        }

        if (hasReported || isReporting) {
            return;
        }

        const confirmed = window.confirm('Bu məhsulu şikayət etmək istədiyinizə əminsiniz?');
        if (!confirmed) {
            return;
        }

        try {
            setIsReporting(true);
            await api.post(`/user/${user.id}/product/${id}/report`, {});
            setHasReported(true);
            toast.success('Məhsul şikayət edildi. Təşəkkür edirik.');
        } catch (error) {
            console.error('Məhsulu şikayət etmək mümkün olmadı:', error);
            toast.error('Şikayət edilə bilmədi. Yenidən cəhd edin.');
        } finally {
            setIsReporting(false);
        }
    };

    const toNumber = (value) => {
        const n = Number(value);
        return Number.isFinite(n) ? n : 0;
    };

    const getActiveCampaign = () => (campaigns && campaigns.length > 0 ? campaigns[0] : null);

    const applyCampaignDiscount = (basePrice, campaign) => {
        const safeBase = Math.max(0, toNumber(basePrice));
        if (!campaign || safeBase <= 0) return safeBase;

        if (campaign.discountType === 'PERCENTAGE') {
            const percent = Math.min(100, Math.max(0, toNumber(campaign.discountValue)));
            return Math.max(0, safeBase * (1 - percent / 100));
        }

        return Math.max(0, safeBase - toNumber(campaign.discountValue));
    };

    const getCurrentUnitPrice = () => {
        const basePrice = Math.max(0, toNumber(product?.price));
        const discounted = applyCampaignDiscount(basePrice, getActiveCampaign());
        return discounted < basePrice ? discounted : basePrice;
    };

    const handleOrderSubmit = async (e) => {
        e.preventDefault();
        if (!user || !token) {
            navigate('/login');
            return;
        }

        try {
            setIsOrderingAction(true);
            const originalUnitPrice = Math.max(0, toNumber(product?.price));
            const discountedUnitPrice = getCurrentUnitPrice();
            const hasCampaignDiscount = discountedUnitPrice < originalUnitPrice;
            
            if (orderForm.paymentMethod === 'Kartla') {
                navigate('/payment', { 
                    state: { 
                        orderData: {
                            id: id,
                            title: product.title,
                            price: discountedUnitPrice.toFixed(2),
                            originalPrice: originalUnitPrice.toFixed(2),
                            total: Number((discountedUnitPrice * purchaseQuantity).toFixed(2)),
                            originalTotal: Number((originalUnitPrice * purchaseQuantity).toFixed(2)),
                            campaignDiscountAmount: hasCampaignDiscount
                                ? Number(((originalUnitPrice - discountedUnitPrice) * purchaseQuantity).toFixed(2))
                                : 0,
                            quantity: purchaseQuantity,
                            deliveryCity: orderForm.deliveryCity,
                            paymentMethod: 'Kartla'
                        }
                    } 
                });
                return;
            }

            await api.post(`/user/${user.id}/orders`, {
                productId: id,
                paymentMethod: orderForm.paymentMethod,
                deliveryCity: orderForm.deliveryCity,
                quantity: purchaseQuantity
            });
            toast.success("Sifarişiniz uğurla qəbul edildi!");
            setIsOrderModalOpen(false);
        } catch (error) {
            console.error("Sifariş xətası:", error);
            toast.error("Sifariş zamanı xəta baş verdi.");
        } finally {
            setIsOrderingAction(false);
        }
    };

    if (loading) {
        return (
            <div className="container" style={{ padding: '5rem 20px', display: 'flex', justifyContent: 'center' }}>
                <div className="loader">Yüklənir...</div>
            </div>
        );
    }

    if (!product) {
        return <div className="container" style={{ padding: '5rem 20px', textAlign: 'center' }}>Məhsul tapılmadı.</div>;
    }

    const isNewProduct = toBoolean(product.isNew);
    const hasDelivery = toBoolean(product.isDelivery);

    const cachedImages = getCachedPreviewImages(product.id);
    const images = product.imageUrls && product.imageUrls.length > 0
        ? product.imageUrls
        : statePreviewImages.length > 0
            ? statePreviewImages
        : cachedImages.length > 0
            ? cachedImages
            : ["https://via.placeholder.com/800x600?text=Şəkil+Yoxdur"];

    const sellerName = seller?.name || `İstifadəçi ${product.userId ? product.userId.toString().substring(0, 5) : 'SM'}`;
    const sellerRole = String(seller?.userRole || seller?.role || '').toUpperCase();
    const isMarketSeller = sellerRole.includes('MARKET') || sellerRole.includes('ADMIN');
    const averageRating = reviews.length
        ? (reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length).toFixed(1)
        : '0.0';
    const originalUnitPrice = Math.max(0, toNumber(product.price));
    const discountedUnitPrice = getCurrentUnitPrice();
    const hasCampaignDiscount = discountedUnitPrice < originalUnitPrice;

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!user || !token) {
            navigate('/login');
            return;
        }
        if (!reviewForm.comment.trim()) return;

        try {
            const response = await api.post(`/user/${user.id}/product/${id}/reviews`, {
                rating: Number(reviewForm.rating),
                comment: reviewForm.comment.trim(),
                userName: user?.name || user?.email || 'Anonim'
            });
            const createdReview = response?.data?.data;
            if (createdReview) {
                setReviews((prev) => [createdReview, ...prev]);
            }
            setReviewForm({ rating: 5, comment: '' });
        } catch (error) {
            console.error('Rəy göndərilərkən xəta baş verdi:', error);
            toast.error('Rəy göndərilə bilmədi.');
        }
    };

    return (
        <div className="container" style={{ padding: '3rem 20px', maxWidth: '1200px' }}>
            <div className="product-layout">
                {/* Left Side: Image Slider */}
                <div className="image-section">
                    <motion.div
                        className="main-image-container glass"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <AnimatePresence mode="wait">
                            <motion.img
                                key={activeImageIndex}
                                src={images[activeImageIndex]}
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                transition={{ duration: 0.3 }}
                                alt={product.title}
                                className="main-image"
                            />
                        </AnimatePresence>

                        {images.length > 1 && (
                            <>
                                <button className="slider-nav-btn prev" onClick={prevImage}>
                                    <ChevronLeft size={24} />
                                </button>
                                <button className="slider-nav-btn next" onClick={nextImage}>
                                    <ChevronRight size={24} />
                                </button>
                                <div className="image-pagination">
                                    {activeImageIndex + 1} / {images.length}
                                </div>
                            </>
                        )}
                    </motion.div>

                    {images.length > 1 && (
                        <div className="thumbnails-container">
                            {images.map((img, idx) => (
                                <div
                                    key={idx}
                                    className={`thumbnail ${idx === activeImageIndex ? 'active' : ''}`}
                                    onClick={() => setActiveImageIndex(idx)}
                                >
                                    <img src={img} alt={`thumb-${idx}`} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Side: Product Info */}
                <div className="info-section">
                    <motion.div
                        className="info-card glass"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <div className="badge">{product.category || 'General'}</div>
                        <h1 className="product-title">{product.title}</h1>
                        {hasCampaignDiscount ? (
                            <div className="product-price" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                <span>{discountedUnitPrice.toFixed(2)} ₼</span>
                                <span style={{ fontSize: '1.2rem', textDecoration: 'line-through', color: 'var(--text-light)', fontWeight: 600 }}>
                                    {originalUnitPrice.toFixed(2)} ₼
                                </span>
                            </div>
                        ) : (
                            <div className="product-price">{originalUnitPrice.toFixed(2)} ₼</div>
                        )}

                        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-light)' }}>Say:</div>
                            <div className="quantity-selector glass" style={{ display: 'flex', alignItems: 'center', borderRadius: '12px', padding: '4px' }}>
                                <button onClick={() => setPurchaseQuantity(q => Math.max(1, q - 1))} style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><Minus size={18} /></button>
                                <span style={{ width: '40px', textAlign: 'center', fontWeight: 800 }}>{purchaseQuantity}</span>
                                <button onClick={() => setPurchaseQuantity(q => q + 1)} style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><Plus size={18} /></button>
                            </div>
                        </div>

                        <div className="main-actions" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <button 
                                className="btn-primary buy-btn" 
                                style={{ flex: 1.5, padding: '16px', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                                onClick={() => setIsOrderModalOpen(true)}
                            >
                                <ShoppingBag size={20} />
                                <span>İndi Sifariş Et</span>
                            </button>
                            <button 
                                className="btn-accent" 
                                style={{ flex: 1, padding: '16px', borderRadius: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                                onClick={() => {
                                    addToCart({ ...product, price: discountedUnitPrice }, purchaseQuantity);
                                    toast.success('Məhsul səbətə əlavə edildi!');
                                }}
                            >
                                <ShoppingCart size={20} />
                                <span>Səbətə At</span>
                            </button>
                        </div>

                        <div className="action-buttons">
                            <button 
                                className={`icon-btn favorite ${isFavorited ? 'active' : ''}`} 
                                onClick={toggleFavorite}
                                title={isFavorited ? "Favoritlərdən çıxar" : "Favoritlərə əlavə et"}
                            >
                                <Heart size={20} fill={isFavorited ? "#f43f5e" : "none"} color={isFavorited ? "#f43f5e" : "currentColor"} />
                            </button>
                            <button className="icon-btn share" title="Paylaş" onClick={handleShareClick}>
                                <Share2 size={20} />
                            </button>
                            <button
                                className="icon-btn report"
                                title={hasReported ? 'Bu məhsulu şikayət etmisiniz' : 'Məhsulu şikayət et'}
                                onClick={handleReportProduct}
                                disabled={hasReported || isReporting}
                            >
                                <ShieldAlert size={20} />
                                <span>{hasReported ? 'Şikayət edildi' : 'Şikayət et'}</span>
                            </button>
                        </div>
                        {shareNotice && <div className="share-notice">{shareNotice}</div>}

                        <div className="product-metadata">
                            <div className="metadata-item">
                                <MapPin size={18} /> <span>{product.city || 'Bakı'}</span>
                            </div>
                            <div className="metadata-item">
                                <Calendar size={18} /> <span>{new Date(product.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="metadata-item">
                                <Package size={18} />
                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>Yeni məhsuldur</span>
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '999px',
                                        fontSize: '0.78rem',
                                        fontWeight: 700,
                                        backgroundColor: isNewProduct ? '#dcfce7' : '#f3f4f6',
                                        color: isNewProduct ? '#166534' : '#6b7280'
                                    }}>
                                        {isNewProduct ? 'Bəli' : 'Xeyr'}
                                    </span>
                                </span>
                            </div>
                            <div className="metadata-item">
                                <Truck size={18} />
                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>Çatdırılma var</span>
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '999px',
                                        fontSize: '0.78rem',
                                        fontWeight: 700,
                                        backgroundColor: hasDelivery ? '#dcfce7' : '#f3f4f6',
                                        color: hasDelivery ? '#166534' : '#6b7280'
                                    }}>
                                        {hasDelivery ? 'Bəli' : 'Xeyr'}
                                    </span>
                                </span>
                            </div>
                            <div className="metadata-item">
                                <ShieldCheck size={18} /> <span>Təhlükəsiz alış-veriş</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Seller Profile Card */}
                    <motion.div
                        className="seller-card glass"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="seller-avatar">
                            {seller?.profileImageUrl ? (
                                <img src={seller.profileImageUrl} alt={sellerName} className="seller-photo" />
                            ) : (
                                sellerName.substring(0, 2).toUpperCase()
                            )}
                        </div>
                        <Link 
                            to={`/seller-store/${product.userId}`} 
                            className="seller-info" 
                            style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', gap: '4px' }}
                        >
                            <div className="seller-name" style={{ fontWeight: 700, fontSize: '1.1rem' }}>{sellerName}</div>
                            <div className="seller-status" style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>
                                {isMarketSeller ? 'Market hesabı' : 'Netbazar istifadəçisi'}
                            </div>
                        </Link>
                        <button className="btn-accent chat-btn" onClick={handleChatClick}>
                            <MessageCircle size={18} />
                            <span>{isMarketSeller ? 'Marketə yaz' : 'Satıcıya yaz'}</span>
                        </button>
                    </motion.div>
                </div>
            </div>

            {/* Description Section */}
            <motion.div
                className="description-section"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
            >
                <h2 className="section-title">Məhsul Haqqında</h2>
                <div className="description-text glass">
                    {product.description}
                </div>

                <div className="product-footer-meta">
                    <span className="meta-item">№ {product.id?.split('-')[0].toUpperCase()}</span>
                    <span className="meta-item">{new Date(product.createdAt).toLocaleString('az-AZ', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="meta-item">Baxışların sayı: {product.viewers || 0}</span>
                </div>
            </motion.div>

            <motion.div
                className="reviews-section"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{ marginTop: '2rem' }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
                    <h2 className="section-title">Rəylər və qiymətləndirmə</h2>
                    <div style={{ padding: '0.75rem 1rem', borderRadius: '999px', background: 'rgba(18,119,73,0.08)', color: 'var(--primary)', fontWeight: 700 }}>
                        Orta bal: {averageRating} / 5
                    </div>
                </div>

                <form
                    onSubmit={handleReviewSubmit}
                    className="glass"
                    style={{ padding: '1rem', borderRadius: '16px', marginBottom: '1rem' }}
                >
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.75rem', alignItems: 'flex-end' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontWeight: 600 }}>
                            Bal
                            <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                                {[1, 2, 3, 4, 5].map((rating) => (
                                    <button
                                        key={rating}
                                        type="button"
                                        onClick={() => setReviewForm((prev) => ({ ...prev, rating }))}
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '10px',
                                            border: `1px solid ${Number(reviewForm.rating) >= rating ? 'var(--accent)' : 'var(--border)'}`,
                                            background: Number(reviewForm.rating) >= rating ? 'rgba(175,134,47,0.12)' : '#fff',
                                            color: Number(reviewForm.rating) >= rating ? 'var(--accent)' : 'var(--text-light)',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s ease'
                                        }}
                                        aria-label={`${rating} ulduz`}
                                    >
                                        <Star 
                                            size={20} 
                                            fill={Number(reviewForm.rating) >= rating ? 'var(--accent)' : 'none'} 
                                            strokeWidth={Number(reviewForm.rating) >= rating ? 0 : 2}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontWeight: 600, flex: 1 }}>
                            Şərh
                            <input value={reviewForm.comment} onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))} placeholder="Məhsul haqqında fikrinizi yazın" style={{ padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--border)' }} />
                        </label>
                    </div>
                    <button type="submit" className="btn-primary">Rəy göndər</button>
                </form>

                {reviewLoading ? (
                    <div className="glass" style={{ padding: '1rem', borderRadius: '16px' }}>Rəylər yüklənir...</div>
                ) : reviews.length === 0 ? (
                    <div className="glass" style={{ padding: '1rem', borderRadius: '16px', color: 'var(--text-light)' }}>Bu məhsul üçün hələ rəy yoxdur.</div>
                ) : (
                    <div className="grid" style={{ gap: '1rem' }}>
                        {reviews.map((review) => (
                            <div key={review.id} className="glass" style={{ padding: '1rem', borderRadius: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.5rem' }}>
                                    <strong>{review.userName || review.name}</strong>
                                    <span style={{ color: 'var(--accent)', display: 'flex', gap: '2px' }}>
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <Star 
                                                key={star} 
                                                size={14} 
                                                fill={star <= (review.rating || 0) ? 'var(--accent)' : 'none'} 
                                                color={star <= (review.rating || 0) ? 'var(--accent)' : 'var(--border)'}
                                                strokeWidth={star <= (review.rating || 0) ? 0 : 2}
                                            />
                                        ))}
                                    </span>
                                </div>
                                <p style={{ color: 'var(--text-light)' }}>{review.comment}</p>
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* Order Modal */}
            <AnimatePresence>
                {isOrderModalOpen && (
                    <motion.div 
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOrderModalOpen(false)}
                    >
                        <motion.div 
                            className="modal-content glass"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h3>Məhsulu Sifariş Et</h3>
                                <button className="close-btn" onClick={() => setIsOrderModalOpen(false)}>
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleOrderSubmit} className="order-form">
                                <div className="form-group">
                                    <label>Çatdırılma Şəhəri</label>
                                    <select 
                                        value={orderForm.deliveryCity} 
                                        onChange={(e) => setOrderForm(prev => ({ ...prev, deliveryCity: e.target.value }))}
                                    >
                                        <option value="Bakı">Bakı</option>
                                        <option value="Sumqayıt">Sumqayıt</option>
                                        <option value="Gəncə">Gəncə</option>
                                        <option value="Xırdalan">Xırdalan</option>
                                        <option value="Digər">Digər</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Ödəniş Üsulu</label>
                                    <div className="payment-options">
                                        <button 
                                            type="button"
                                            className={`payment-option ${orderForm.paymentMethod === 'Kartla' ? 'active' : ''}`}
                                            onClick={() => setOrderForm(prev => ({ ...prev, paymentMethod: 'Kartla' }))}
                                        >
                                            <CreditCard size={20} />
                                            <span>Onlayn Kartla</span>
                                        </button>
                                        <button 
                                            type="button"
                                            className={`payment-option ${orderForm.paymentMethod === 'Nağd' ? 'active' : ''}`}
                                            onClick={() => setOrderForm(prev => ({ ...prev, paymentMethod: 'Nağd' }))}
                                        >
                                            <Package size={20} />
                                            <span>Qapıda Ödəniş</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="order-summary glass">
                                     <div className="summary-item">
                                         <span>Məhsul:</span>
                                         <span>{product.title}</span>
                                     </div>
                                     <div className="summary-item">
                                         <span>Miqdar:</span>
                                         <span>{purchaseQuantity} ədəd</span>
                                     </div>
                                     <div className="summary-item total">
                                         <span>Cəmi:</span>
                                         <span>{(discountedUnitPrice * purchaseQuantity).toFixed(2)} ₼</span>
                                     </div>
                                     {hasCampaignDiscount && (
                                         <div className="summary-item" style={{ color: 'var(--text-light)' }}>
                                             <span>Əvvəlki qiymət:</span>
                                             <span style={{ textDecoration: 'line-through' }}>{(originalUnitPrice * purchaseQuantity).toFixed(2)} ₼</span>
                                         </div>
                                     )}
                                 </div>
                                 <button type="submit" className="btn-primary submit-order-btn" disabled={isOrderingAction}>
                                     {isOrderingAction ? 'Gözləyin...' : 'Sifarişi Tamamla'}
                                 </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.5);
                    backdrop-filter: blur(4px);
                    z-index: 2000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }
                .modal-content {
                    width: 100%;
                    max-width: 500px;
                    border-radius: 24px;
                    padding: 2rem;
                    background: rgba(255, 255, 255, 0.95);
                    box-shadow: 0 20px 50px rgba(0,0,0,0.2);
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }
                .modal-header h3 {
                    font-size: 1.4rem;
                    font-weight: 800;
                }
                .close-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: var(--text-light);
                    transition: color 0.2s;
                }
                .close-btn:hover { color: var(--text); }
                .form-group {
                    margin-bottom: 1.5rem;
                }
                .form-group label {
                    display: block;
                    font-weight: 700;
                    margin-bottom: 0.5rem;
                    font-size: 0.9rem;
                }
                .form-group select {
                    width: 100%;
                    padding: 12px;
                    border-radius: 12px;
                    border: 1px solid var(--border);
                    background: white;
                    font-size: 1rem;
                }
                .payment-options {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                }
                .payment-option {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                    padding: 15px;
                    border-radius: 16px;
                    border: 2px solid var(--border);
                    background: white;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .payment-option.active {
                    border-color: var(--primary);
                    background: rgba(18,119,73,0.05);
                    color: var(--primary);
                }
                .order-summary {
                    padding: 1rem;
                    border-radius: 12px;
                    margin-bottom: 1.5rem;
                }
                .summary-item {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.9rem;
                    margin-bottom: 0.5rem;
                }
                .summary-item.total {
                    margin-top: 0.5rem;
                    padding-top: 0.5rem;
                    border-top: 1px solid var(--border);
                    font-weight: 800;
                    font-size: 1.1rem;
                    color: var(--primary);
                }
                .submit-order-btn {
                    width: 100%;
                    padding: 16px;
                    font-weight: 700;
                    border-radius: 12px;
                }
                .report-toast {
                    position: fixed;
                    top: 22px;
                    right: 22px;
                    z-index: 1200;
                    border-radius: 12px;
                    padding: 12px 14px;
                    font-size: 0.9rem;
                    font-weight: 700;
                    max-width: min(92vw, 360px);
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
                    border: 1px solid transparent;
                    animation: slideToastIn 0.25s ease;
                }

                .report-toast.success {
                    background: #ecfdf3;
                    border-color: #86efac;
                    color: #166534;
                }

                .report-toast.error {
                    background: #fef2f2;
                    border-color: #fca5a5;
                    color: #991b1b;
                }

                @keyframes slideToastIn {
                    from {
                        opacity: 0;
                        transform: translateY(-8px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .product-layout {
                    display: grid;
                    grid-template-columns: 1.2fr 0.8fr;
                    gap: 2rem;
                    align-items: start;
                }

                .image-section {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .main-image-container {
                    position: relative;
                    height: 500px;
                    border-radius: 16px;
                    overflow: hidden;
                    background: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .main-image {
                    max-width: 100%;
                    max-height: 100%;
                    object-fit: contain;
                }

                .slider-nav-btn {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    background: rgba(255, 255, 255, 0.82);
                    border: none;
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    transition: all 0.2s ease;
                    z-index: 10;
                }

                .slider-nav-btn:hover {
                    background: white;
                    color: var(--primary);
                    scale: 1.1;
                }

                .slider-nav-btn.prev { left: 15px; }
                .slider-nav-btn.next { right: 15px; }

                .image-pagination {
                    position: absolute;
                    bottom: 15px;
                    right: 15px;
                    background: rgba(0,0,0,0.6);
                    color: white;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 0.85rem;
                    font-weight: 500;
                }

                .thumbnails-container {
                    display: flex;
                    gap: 0.75rem;
                    overflow-x: auto;
                    padding-bottom: 5px;
                    scrollbar-width: thin;
                }

                .thumbnail {
                    width: 85px;
                    height: 85px;
                    border-radius: 10px;
                    overflow: hidden;
                    cursor: pointer;
                    border: 2px solid transparent;
                    flex-shrink: 0;
                    transition: all 0.2s ease;
                    opacity: 0.7;
                }

                .thumbnail:hover { opacity: 1; }
                .thumbnail.active {
                    border-color: var(--primary);
                    opacity: 1;
                    scale: 0.95;
                }

                .thumbnail img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .info-card {
                    padding: 2.5rem;
                    border-radius: 16px;
                }

                .badge {
                    display: inline-block;
                    background: var(--light);
                    color: var(--primary);
                    padding: 5px 12px;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    margin-bottom: 1rem;
                    text-transform: capitalize;
                }

                .product-title {
                    font-size: 2rem;
                    font-weight: 800;
                    margin-bottom: 0.5rem;
                    color: var(--dark);
                }

                .product-price {
                    font-size: 2.5rem;
                    font-weight: 900;
                    color: var(--primary);
                    margin-bottom: 2rem;
                }

                .action-buttons {
                    display: flex;
                    flex-direction: row;
                    flex-wrap: nowrap;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 2rem;
                }

                .buy-btn {
                    flex: 1;
                    padding: 15px;
                    font-weight: 700;
                    font-size: 1.1rem;
                    border-radius: 12px;
                }

                .icon-btn {
                    width: 54px;
                    height: 54px;
                    border-radius: 12px;
                    border: 1px solid var(--border);
                    background: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    color: var(--text);
                    flex-shrink: 0;
                }

                .icon-btn:hover {
                    border-color: var(--primary);
                    color: var(--primary);
                    background: var(--light);
                }

                .icon-btn.favorite { color: #f43f5e; }
                .icon-btn.favorite:hover { background: #fff1f2; }

                .icon-btn.report {
                    color: #dc2626;
                    width: auto;
                    min-width: 136px;
                    padding: 0 14px;
                    gap: 8px;
                    font-weight: 700;
                    border-color: #fecaca;
                    background: #fff5f5;
                }

                .icon-btn.report:hover {
                    background: #fef2f2;
                    border-color: #ef4444;
                    color: #b91c1c;
                }

                .icon-btn:disabled {
                    opacity: 0.55;
                    cursor: not-allowed;
                }

                .share-notice {
                    margin-top: -1.2rem;
                    margin-bottom: 1.2rem;
                    color: #0f766e;
                    font-size: 0.9rem;
                    font-weight: 600;
                }

                .product-metadata {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    border-top: 1px solid var(--border);
                    padding-top: 1.5rem;
                }

                .metadata-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    color: var(--text-light);
                    font-size: 0.95rem;
                }

                .seller-card {
                    margin-top: 1.5rem;
                    padding: 1.5rem;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .seller-avatar {
                    width: 54px;
                    height: 54px;
                    border-radius: 50%;
                    background: var(--accent);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: 700;
                    overflow: hidden; /* Added to clip the image to the circle */
                }

                .seller-photo {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .seller-info { flex: 1; }
                .seller-name { font-weight: 700; color: var(--dark); }
                .seller-status { font-size: 0.8rem; color: var(--text-light); }

                .chat-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 20px;
                    border-radius: 20px;
                    font-weight: 600;
                }

                .description-section { margin-top: 4rem; }
                .section-title { margin-bottom: 1.5rem; font-size: 1.5rem; }
                .description-text {
                    padding: 2rem;
                    border-radius: 16px;
                    line-height: 1.8;
                    color: var(--text-light);
                    white-space: pre-wrap;
                }

                .product-footer-meta {
                    margin-top: 1.5rem;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 2rem;
                    padding: 1rem 0;
                    border-top: 1px solid var(--border);
                    color: var(--text-light);
                    font-size: 0.85rem;
                }

                .meta-item {
                    display: flex;
                    align-items: center;
                }

                @media (max-width: 992px) {
                    .product-layout { grid-template-columns: 1fr; gap: 1.5rem; }
                    .main-image-container { height: 450px; }
                    .info-card { padding: 1.5rem; }
                }

                @media (max-width: 768px) {
                    .main-image-container { height: 350px; }
                    .action-buttons { flex-direction: row; gap: 0.75rem; }
                    .buy-btn { width: 100%; order: 1; height: 56px; }
                    .thumbnail { width: 70px; height: 70px; }
                    .seller-card { flex-direction: column; text-align: center; gap: 1rem; }
                    .chat-btn { width: 100%; justify-content: center; }
                }

                @media (max-width: 480px) {
                    .main-image-container { height: 280px; border-radius: 0; margin: 0 calc(-1 * var(--container-padding)); width: calc(100% + (2 * var(--container-padding))); }
                    .product-title { font-size: 1.5rem; }
                    .product-price { font-size: 1.8rem; }
                    .description-text { padding: 1.2rem; font-size: 0.95rem; }
                }
            `}</style>
        </div>
    );
};

export default ProductDetail;
