import React, { useEffect, useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, ChevronRight, Sparkles, ShieldCheck, Truck, Heart, Star, ShoppingBag, Camera, Smartphone, Shirt, Home as HomeIcon, Dumbbell, BookOpen, CarFront, Apple, Wrench, Headphones, Gamepad2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';

const PRODUCT_PREVIEW_CACHE_KEY = 'productImagePreviewCache';
const DEFAULT_COUNTDOWN = 5 * 3600 + 42 * 60 + 17;

const categories = [
    { id: 'ALL', label: 'Hamısı', icon: ShoppingBag },
    { id: 'ELECTRONICS', label: 'Elektronika', icon: Smartphone },
    { id: 'WEAR', label: 'Geyim & Moda', icon: Shirt },
    { id: 'HOME_AND_GARDEN', label: 'Ev & Bağ', icon: HomeIcon },
    { id: 'BEAUTY', label: 'Gözəllik', icon: Sparkles },
    { id: 'SPORT', label: 'İdman', icon: Dumbbell },
    { id: 'BOOK', label: 'Kitablar', icon: BookOpen },
    { id: 'TOY', label: 'Oyuncaqlar', icon: Gamepad2 },
    { id: 'CAR', label: 'Avtomobil', icon: CarFront },
    { id: 'FOOD', label: 'Qida', icon: Apple },
    { id: 'SERVICES', label: 'Xidmətlər', icon: Wrench },
    { id: 'OTHERS', label: 'Digər', icon: Headphones }
];
const marketPromos = [];

const cleanPreviewCache = (rawCache) => {
    const now = Date.now();
    return Object.entries(rawCache || {}).reduce((acc, [productId, entry]) => {
        if (entry && Array.isArray(entry.urls) && entry.urls.length > 0 && (!entry.expiresAt || entry.expiresAt > now)) {
            acc[productId] = entry;
        }
        return acc;
    }, {});
};

const readPreviewImage = (previewCache, productId) => previewCache?.[productId]?.urls?.[0] || null;

const Home = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [previewCache, setPreviewCache] = useState({});
    const [countdown, setCountdown] = useState(DEFAULT_COUNTDOWN);
    const [platformPromos, setPlatformPromos] = useState([]);
    const [campaigns, setCampaigns] = useState([]);

    const applyCampaignDiscount = (basePrice, campaign) => {
        if (!campaign) return Number(basePrice) || 0;
        const safeBase = Math.max(0, Number(basePrice) || 0);
        if (campaign.discountType === 'PERCENTAGE') {
            const percent = Math.min(100, Math.max(0, Number(campaign.discountValue) || 0));
            return Math.max(0, safeBase * (1 - percent / 100));
        }
        return Math.max(0, safeBase - (Number(campaign.discountValue) || 0));
    };

    const getActiveCampaign = () => {
        return campaigns && campaigns.length > 0 ? campaigns[0] : null;
    };

    const calculateDiscountedPrice = (basePrice) => {
        const campaign = getActiveCampaign();
        if (!campaign) return { discountedPrice: basePrice, discountPercentage: 0 };
        const discounted = applyCampaignDiscount(basePrice, campaign);
        const percentage = campaign.discountType === 'PERCENTAGE'
            ? Math.min(100, Math.max(0, Number(campaign.discountValue) || 0))
            : Math.round(((Number(basePrice) - discounted) / Number(basePrice)) * 100);
        return {
            discountedPrice: discounted,
            discountPercentage: percentage
        };
    };

    useEffect(() => {
        const fetchCampaigns = async () => {
            try {
                const response = await api.get('/campaigns');
                const campaignsData = response?.data?.data || [];
                setCampaigns(campaignsData);
                const mapped = campaignsData.map((c, i) => ({
                    id: c.id,
                    tag: c.discountType === 'PERCENTAGE' ? `-${c.discountValue}%` : `-${c.discountValue}₼`,
                    title: c.name,
                    className: i === 0 ? 'p1' : i === 1 ? 'p2' : 'p3',
                    bannerUrl: c.bannerUrl
                }));
                setPlatformPromos(mapped.length > 0 ? mapped : marketPromos);
            } catch (err) {
                console.error('Failed to load campaigns', err);
                setPlatformPromos(marketPromos);
            }
        };
        fetchCampaigns();
    }, []);

    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);



    useEffect(() => {
        if (user) {
            const roleText = String(user.userRole || user.role || user.roles || user.authorities || '').toUpperCase();
            if (roleText.includes('SELLER')) {
                navigate('/seller/dashboard');
            }
        }
    }, [user, navigate]);
    const queryParams = new URLSearchParams(location.search);
    const searchQuery = queryParams.get('search');

    const fetchProducts = async (category = 'ALL', search = null, page = 0) => {
        setLoading(true);
        try {
            const size = 30;
            const url = search
                ? `/search?q=${encodeURIComponent(search)}`
                : category === 'ALL'
                    ? `/?page=${page}&size=${size}`
                    : `/category/${category}?page=${page}&size=${size}`;

            const response = await api.get(url);
            const data = response?.data?.data;
            const fetchedProducts = search ? (data || []) : (data?.content || []);

            setProducts(fetchedProducts);
            setTotalPages(search ? 0 : (data?.totalPages || 0));

            const currentCache = JSON.parse(sessionStorage.getItem(PRODUCT_PREVIEW_CACHE_KEY) || '{}');
            const prunedCache = { ...currentCache };
            fetchedProducts.forEach((product) => {
                if (product?.id && Array.isArray(product.imageUrls) && product.imageUrls.length > 0) {
                    delete prunedCache[product.id];
                }
            });
            const cleaned = cleanPreviewCache(prunedCache);
            setPreviewCache(cleaned);
            sessionStorage.setItem(PRODUCT_PREVIEW_CACHE_KEY, JSON.stringify(cleaned));
        } catch (error) {
            console.error('Məhsullar yüklənərkən xəta baş verdi:', error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (searchQuery) {
            setSearchTerm(searchQuery);
        }
    }, [searchQuery]);

    useEffect(() => {
        const optimisticProduct = location.state?.optimisticProduct;
        if (!optimisticProduct) return;

        setProducts((prev) => {
            const exists = prev.some((product) => String(product.id) === String(optimisticProduct.id));
            return exists ? prev : [optimisticProduct, ...prev];
        });

        navigate(`${location.pathname}${location.search}`, { replace: true, state: {} });
    }, [location.state, location.pathname, location.search, navigate]);

    useEffect(() => {
        const rawCache = JSON.parse(sessionStorage.getItem(PRODUCT_PREVIEW_CACHE_KEY) || '{}');
        const cleaned = cleanPreviewCache(rawCache);
        setPreviewCache(cleaned);
        sessionStorage.setItem(PRODUCT_PREVIEW_CACHE_KEY, JSON.stringify(cleaned));
    }, []);

    useEffect(() => {
        const timer = window.setInterval(() => {
            setCountdown((prev) => (prev > 0 ? prev - 1 : DEFAULT_COUNTDOWN));
        }, 1000);
        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        const debounceTimer = window.setTimeout(() => {
            if (searchTerm.trim()) {
                fetchProducts('ALL', searchTerm, 0);
            } else if (searchQuery) {
                fetchProducts('ALL', searchQuery, 0);
            } else {
                fetchProducts(selectedCategory, null, currentPage);
            }
        }, 120);

        return () => window.clearTimeout(debounceTimer);
    }, [searchTerm, selectedCategory, searchQuery, currentPage]);

    useEffect(() => {
        setCurrentPage(0);
    }, [selectedCategory, searchTerm]);

    const countdownHours = String(Math.floor(countdown / 3600)).padStart(2, '0');
    const countdownMinutes = String(Math.floor((countdown % 3600) / 60)).padStart(2, '0');
    const countdownSeconds = String(countdown % 60).padStart(2, '0');

    const visibleProducts = products.slice(0, 10);
    const featuredProducts = visibleProducts.slice(0, 5);
    const recommendedProducts = visibleProducts.slice(5, 10);

    return (
        <div className="animate-fade-in market-page">
            <style>{`
                .market-page {
                    font-family: 'Noto Sans', 'Segoe UI', 'Arial', sans-serif;
                }
                .hero-card {
                    border-radius: 16px;
                    background: var(--primary);
                    min-height: 340px;
                    position: relative;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-end;
                    padding: 2.5rem;
                }
                .hero-card::before {
                    content: '';
                    position: absolute;
                    top: -60px;
                    right: -60px;
                    width: 340px;
                    height: 340px;
                    border-radius: 50%;
                    background: rgba(255,255,255,.06);
                }
                .hero-card::after {
                    content: '';
                    position: absolute;
                    bottom: -80px;
                    right: 80px;
                    width: 260px;
                    height: 260px;
                    border-radius: 50%;
                    background: rgba(255,255,255,.04);
                }
                .hero-tag {
                    display: inline-block;
                    background: linear-gradient(135deg, rgb(73 56 20), rgb(175 134 47));
                    color: #fff;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: .08em;
                    text-transform: uppercase;
                    padding: 5px 12px;
                    border-radius: 6px;
                    margin-bottom: 14px;
                    width: fit-content;
                }
                .hero-title {
                    font-size: clamp(2.4rem, 5vw, 4.2rem);
                    line-height: 1.06;
                    letter-spacing: -0.04em;
                    color: #fff;
                    margin-bottom: 10px;
                    position: relative;
                    z-index: 1;
                }
                .hero-sub {
                    font-size: 15px;
                    color: rgba(255,255,255,.75);
                    margin-bottom: 24px;
                    position: relative;
                    z-index: 1;
                }
                .hero-cta {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: linear-gradient(135deg, rgb(73 56 20), rgb(175 134 47));
                    color: #fff;
                    font-size: 14px;
                    font-weight: 600;
                    padding: 12px 26px;
                    border-radius: 10px;
                    text-decoration: none;
                    width: fit-content;
                    position: relative;
                    z-index: 1;
                    transition: opacity .2s, transform .15s;
                }
                .hero-cta:hover { opacity: .9; transform: translateY(-1px); }
                .mini-banners {
                    display: flex;
                    flex-direction: column;
                    gap: .75rem;
                }
                .mini-banner {
                    border-radius: 12px;
                    padding: 1.3rem 1.2rem;
                    text-decoration: none;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    transition: transform .15s;
                    min-height: 80px;
                    justify-content: center;
                }
                .mini-banner:hover { transform: translateY(-2px); }
                .mini-banner.gold-b { background: linear-gradient(135deg, rgb(73 56 20), rgb(175 134 47)); }
                .mini-banner.green-b { background: var(--primary); }
                .mini-banner .mb-tag {
                    font-size: 10.5px;
                    font-weight: 700;
                    letter-spacing: .07em;
                    text-transform: uppercase;
                    color: rgba(255,255,255,.75);
                }
                .mini-banner .mb-title {
                    font-size: 16px;
                    font-weight: 700;
                    color: #fff;
                    line-height: 1.2;
                }
                .brands-strip {
                    display: flex;
                    align-items: center;
                    gap: 0;
                    background: rgba(255,255,255,0.82);
                    border: 1px solid var(--border);
                    border-radius: 10px;
                    overflow: hidden;
                }
                .brands-label {
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: .07em;
                    text-transform: uppercase;
                    color: rgba(17,17,17,0.55);
                    padding: 13px 20px 13px 0;
                    border-right: 1px solid var(--border);
                    white-space: nowrap;
                    flex-shrink: 0;
                }
                .brands-list {
                    display: flex;
                    align-items: center;
                    overflow-x: auto;
                    scrollbar-width: none;
                }
                .brands-list::-webkit-scrollbar { display: none; }
                .brand-item {
                    padding: 10px 22px;
                    font-family: 'Syne', sans-serif;
                    font-weight: 700;
                    font-size: 14px;
                    color: rgba(17,17,17,0.62);
                    text-decoration: none;
                    transition: color .2s;
                    white-space: nowrap;
                    border-right: 1px solid var(--border);
                }
                .brand-item:hover { color: var(--primary); }
                .sidebar-card {
                    background: rgba(255,255,255,0.88);
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    overflow: hidden;
                }
                .sidebar-link {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 11px 16px;
                    font-size: 13px;
                    color: var(--text);
                    text-decoration: none;
                    border-bottom: 1px solid var(--border);
                    transition: background .15s, color .15s;
                }
                .sidebar-link:last-child { border-bottom: none; }
                .sidebar-link:hover { background: rgba(232,245,239,0.8); color: var(--primary); }
                .sidebar-link span { font-size: 17px; }
                .hero-actions-row {
                    display: flex;
                    flex-wrap: wrap;
                    gap: .75rem;
                    margin-top: 1.5rem;
                }
                .hero-stat-grid {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 0.75rem;
                    margin-top: 1.5rem;
                }
                .hero-stat {
                    background: rgba(255,255,255,0.72);
                    border-radius: 16px;
                    padding: 0.9rem;
                    border: 1px solid rgba(73, 56, 20, 0.08);
                }
                .hero-stat strong {
                    display: block;
                    font-size: 1.1rem;
                    color: var(--primary);
                    margin-bottom: 0.25rem;
                }
                .section-headline {
                    display: flex;
                    align-items: end;
                    justify-content: space-between;
                    gap: 1rem;
                    margin-bottom: 1rem;
                }
                .section-headline h2 {
                    font-size: 1.5rem;
                    color: var(--text);
                }
                .section-headline p {
                    color: var(--text-light);
                    font-size: 0.95rem;
                    max-width: 55ch;
                }
                .category-grid {
                    display: grid;
                    grid-template-columns: repeat(8, 1fr);
                    gap: .75rem;
                }
                .category-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    text-decoration: none;
                    padding: 16px 8px;
                    border-radius: 12px;
                    border: 1px solid var(--border);
                    background: rgba(255,255,255,0.86);
                    transition: background .2s, border-color .2s, transform .15s;
                }
                .category-item:hover {
                    background: rgba(232,245,239,0.9);
                    border-color: var(--primary);
                    transform: translateY(-2px);
                }
                .category-icon { font-size: 30px; line-height: 1; }
                .category-label {
                    font-size: 12px;
                    font-weight: 500;
                    color: var(--text);
                    text-align: center;
                    line-height: 1.3;
                }
                .section-link {
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--primary);
                    text-decoration: none;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                .section-link:hover { text-decoration: underline; }
                .flash-head {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                }
                .countdown {
                    display: flex;
                    gap: 6px;
                    align-items: center;
                }
                .cd-unit {
                    background: var(--primary);
                    color: #fff;
                    font-size: 16px;
                    font-weight: 700;
                    padding: 4px 9px;
                    border-radius: 6px;
                    min-width: 36px;
                    text-align: center;
                }
                .cd-sep {
                    font-weight: 700;
                    font-size: 16px;
                    color: rgba(17,17,17,0.5);
                }
                .promo-row {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 1rem;
                }
                .promo-banner {
                    border-radius: 14px;
                    padding: 1.8rem;
                    text-decoration: none;
                    display: block;
                    transition: transform .15s;
                    position: relative;
                    overflow: hidden;
                    min-height: 130px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }
                .promo-banner:hover { transform: translateY(-2px); }
                .promo-banner.p1 { background: linear-gradient(135deg, rgb(73 56 20), rgb(175 134 47)); }
                .promo-banner.p2 { background: var(--primary); }
                .promo-banner.p3 { background: #1a1a1a; }
                .promo-banner::after {
                    content: '';
                    position: absolute;
                    top: -30px; right: -30px;
                    width: 120px; height: 120px;
                    border-radius: 50%;
                    background: rgba(255,255,255,.07);
                }
                .pb-tag {
                    font-size: 11px; font-weight: 700;
                    letter-spacing: .07em; text-transform: uppercase;
                    color: rgba(255,255,255,.7);
                    margin-bottom: 6px;
                }
                .pb-title {
                    font-size: 20px; font-weight: 800;
                    color: #fff;
                    line-height: 1.2;
                    position: relative; z-index: 1;
                }
                .market-product-img {
                    width: 100%;
                    aspect-ratio: 1;
                    background: #ececec;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 56px;
                    position: relative;
                    overflow: hidden;
                }
                .market-product-body {
                    padding: 12px 12px 14px;
                }
                .market-product-brand {
                    font-size: 11px;
                    font-weight: 600;
                    color: var(--primary);
                    text-transform: uppercase;
                    letter-spacing: .05em;
                    margin-bottom: 4px;
                }
                .market-product-name {
                    font-size: 13.5px;
                    color: var(--text);
                    line-height: 1.4;
                    margin-bottom: 8px;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .market-product-price {
                    display: flex;
                    align-items: center;
                    gap: 7px;
                }
                .price-now {
                    font-size: 17px;
                    font-weight: 700;
                    color: var(--primary);
                }
                .price-old {
                    font-size: 12px;
                    color: rgba(17,17,17,0.55);
                    text-decoration: line-through;
                }
                .stars {
                    font-size: 11px;
                    color: rgb(175 134 47);
                    margin-top: 5px;
                    letter-spacing: .04em;
                }
                .stars span {
                    color: rgba(17,17,17,0.55);
                    margin-left: 4px;
                }
                .badge-sale, .badge-new {
                    position: absolute;
                    top: 10px;
                    left: 10px;
                    color: #fff;
                    font-size: 11px;
                    font-weight: 700;
                    padding: 3px 9px;
                    border-radius: 5px;
                    z-index: 2;
                }
                .badge-sale { background: #e63946; }
                .badge-new { background: linear-gradient(135deg, rgb(73 56 20), rgb(175 134 47)); }
                .product-wishlist-btn {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    background: #fff;
                    border: 1px solid var(--border);
                    border-radius: 50%;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity .2s;
                }
                .market-card:hover .product-wishlist-btn { opacity: 1; }
                .floating-strip {
                    background: linear-gradient(90deg, #10221a 0%, #173126 55%, #10221a 100%);
                    border-top: 1px solid rgba(175, 134, 47, 0.25);
                    border-bottom: 1px solid rgba(175, 134, 47, 0.15);
                    overflow: hidden;
                    padding: 12px 0;
                }
                .ticker {
                    display: flex;
                    animation: ticker 30s linear infinite;
                    width: max-content;
                }
                .ticker span {
                    font-size: 13px;
                    font-weight: 500;
                    color: rgba(255,255,255,.72);
                    padding: 0 2.2rem;
                    white-space: nowrap;
                }
                .ticker span strong {
                    color: rgb(207 168 83);
                    font-weight: 700;
                }
                .ticker .ticker-dot {
                    color: rgba(255,255,255,.35);
                    padding: 0 0.6rem;
                }
                @keyframes ticker {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                @media (max-width: 1100px) {
                    .category-grid { grid-template-columns: repeat(4, 1fr); }
                    .hero-stat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                    .promo-row { grid-template-columns: 1fr; }
                }
                @media (max-width: 720px) {
                    .category-grid { grid-template-columns: repeat(2, 1fr); }
                    .hero-stat-grid { grid-template-columns: 1fr; }
                    .hero-card { padding: 1.5rem; }
                }
                @media (max-width: 540px) {
                    .hero-title { max-width: none; }
                }
            `}</style>

            <section className="market-section" style={{ paddingTop: '2rem' }}>
                <div className="hero-layout">
                    <div className="sidebar-card">
                        {categories.map((category) => {
                            const Icon = category.icon;
                            return (
                                <button
                                    key={category.id}
                                    className="sidebar-link"
                                    onClick={() => setSelectedCategory(category.id)}
                                    style={{
                                        width: '100%',
                                        textAlign: 'left',
                                        backgroundColor: selectedCategory === category.id ? 'rgba(232,245,239,0.9)' : 'transparent',
                                        color: selectedCategory === category.id ? 'var(--primary)' : 'var(--text)'
                                    }}
                                >
                                    <span>{Icon ? <Icon size={18} /> : null}</span>
                                    <span>{category.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="hero-card">
                        <div className="hero-tag">Yay Sezonu 2025</div>
                        <h1 className="hero-title">Azərbaycanın Ən Böyük Online Bazarı</h1>
                        <p className="hero-sub">1 milyondan çox məhsul, sürətli çatdırılma və market hesabları üçün aydın satış axını.</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.85rem', borderRadius: '999px', background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(73, 56, 20, 0.08)', fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary)' }}>
                                <Sparkles size={15} /> Təhlükəsiz checkout
                            </div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.85rem', borderRadius: '999px', background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(73, 56, 20, 0.08)', fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary)' }}>
                                <ShieldCheck size={15} /> Sifariş izləmə
                            </div>
                        </div>
                        <div className="hero-actions-row">
                            <button className="hero-cta" onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}>İndi Alış-veriş Et <ChevronRight size={16} /></button>
                            <button className="btn-primary" onClick={() => navigate('/login')}>Hesaba daxil ol</button>
                        </div>
                        <div className="hero-stat-grid">
                            <div className="hero-stat"><strong>1M+</strong><span>Məhsul</span></div>
                            <div className="hero-stat"><strong>5K+</strong><span>Satıcı</span></div>
                            <div className="hero-stat"><strong>24/7</strong><span>Dəstək</span></div>
                        </div>
                    </div>

                    <div className="mini-banners">
                        {platformPromos.slice(0, 3).map((promo, index) => {
                            let bannerClass = "mini-banner";
                            let bannerStyle = {};
                            if (index === 0) bannerClass += " gold-b";
                            else if (index === 1) bannerClass += " green-b";
                            else if (index === 2) bannerStyle = { background: '#1a1a1a' };

                            return (
                                <a key={promo.id || promo.title} className={bannerClass} style={bannerStyle} href="#products">
                                    <div className="mb-tag">{promo.tag}</div>
                                    <div className="mb-title">{promo.title}</div>
                                </a>
                            );
                        })}
                    </div>
                </div>
            </section>



            <section className="market-section" style={{ marginTop: '2.5rem' }}>
                <div className="section-headline">
                    <div>
                        <h2 className="market-section-title" style={{ marginBottom: '0.4rem' }}>Kateqoriyalar</h2>
                        <p>Elektronika, geyim, ev əşyaları və daha çoxu bir yerdə.</p>
                    </div>
                    <a href="#products" className="section-link">Hamısını gör <ChevronRight size={16} /></a>
                </div>
                <div className="category-grid">
                    {categories.slice(1, 9).map((category) => {
                        const Icon = category.icon;
                        return (
                            <button
                                key={category.id}
                                className="category-item"
                                onClick={() => setSelectedCategory(category.id)}
                                style={{
                                    backgroundColor: selectedCategory === category.id ? 'rgba(232,245,239,0.9)' : 'rgba(255,255,255,0.86)',
                                    borderColor: selectedCategory === category.id ? 'var(--primary)' : 'var(--border)'
                                }}
                            >
                                <div className="category-icon">{Icon ? <Icon size={28} /> : null}</div>
                                <div className="category-label">{category.label}</div>
                            </button>
                        );
                    })}
                </div>
            </section>

          

            <section className="market-section" style={{ marginTop: '2.5rem' }}>
                <div className="promo-row">
                    {platformPromos.map((promo) => (
                        <a key={promo.id || promo.title} className={`promo-banner ${promo.className}`} href="#products">
                            <div className="pb-tag">{promo.tag}</div>
                            <div className="pb-title">{promo.title}</div>
                            {promo.bannerUrl && (
                                <img src={promo.bannerUrl} alt={promo.title} style={{ position: 'absolute', right: '-20px', bottom: '-10px', height: '100%', opacity: 0.2, objectFit: 'contain' }} />
                            )}
                        </a>
                    ))}
                </div>
            </section>

            <section className="market-section" style={{ marginTop: '2.5rem' }}>
                <div className="section-headline">
                    <div>
                        <h2 className="market-section-title" style={{ marginBottom: '0.4rem' }}>Sizin üçün Tövsiyələr</h2>
                        <p>Müştəriyə uyğun məhsullar, rahat sifariş izləmə və daha aydın seçim axını.</p>
                    </div>
                    <a href="#products" className="section-link">Hamısını gör <ChevronRight size={16} /></a>
                </div>

                <div id="products" className="market-grid">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem', gridColumn: '1/-1' }}>Yüklənir...</div>
                    ) : recommendedProducts.length > 0 ? (
                        recommendedProducts.map((product, index) => (
                            <MarketProductCard
                                key={product.id}
                                product={product}
                                previewImage={readPreviewImage(previewCache, product.id)}
                                index={index + 5}
                                calculateDiscountedPrice={calculateDiscountedPrice}
                            />
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', padding: '3rem', gridColumn: '1/-1', color: 'var(--text-light)' }}>Heç bir məhsul tapılmadı.</div>
                    )}
                </div>

                {!loading && totalPages > 1 && !searchTerm && (
                    <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', paddingBottom: '1rem' }}>
                        <button
                            disabled={currentPage === 0}
                            onClick={() => setCurrentPage((prev) => prev - 1)}
                            style={{
                                padding: '8px 20px',
                                borderRadius: '10px',
                                backgroundColor: currentPage === 0 ? '#eee' : 'var(--surface)',
                                border: '1px solid var(--border)',
                                cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                                fontWeight: 600
                            }}
                        >
                            Əvvəlki
                        </button>
                        <span style={{ fontWeight: 600 }}>Səhifə {currentPage + 1} / {totalPages}</span>
                        <button
                            disabled={currentPage === totalPages - 1}
                            onClick={() => setCurrentPage((prev) => prev + 1)}
                            style={{
                                padding: '8px 20px',
                                borderRadius: '10px',
                                backgroundColor: currentPage === totalPages - 1 ? '#eee' : 'var(--surface)',
                                border: '1px solid var(--border)',
                                cursor: currentPage === totalPages - 1 ? 'not-allowed' : 'pointer',
                                fontWeight: 600
                            }}
                        >
                            Növbəti
                        </button>
                    </div>
                )}
            </section>

            <div className="floating-strip" style={{ marginTop: '3rem' }}>
                <div className="ticker">
                    <span>Çatdırılma: <strong>Bakı üçün 24 saat</strong></span>
                    <span className="ticker-dot">•</span>
                    <span>Təhlükəsiz ödəniş: <strong>256-bit SSL</strong></span>
                    <span className="ticker-dot">•</span>
                    <span><strong>30 gün</strong> pulsuz qaytarma</span>
                    <span className="ticker-dot">•</span>
                    <span><strong>Gold Üzvlük</strong> ilə daha çox qazanın</span>
                    <span className="ticker-dot">•</span>
                    <span><strong>1.000.000+</strong> məhsul hazır stokda</span>
                    <span className="ticker-dot">•</span>
                    <span>Azərbaycanda <strong>5000+</strong> satıcı</span>
                    <span className="ticker-dot">•</span>
                    <span>Çatdırılma: <strong>Bakı üçün 24 saat</strong></span>
                    <span className="ticker-dot">•</span>
                    <span>Təhlükəsiz ödəniş: <strong>256-bit SSL</strong></span>
                    <span className="ticker-dot">•</span>
                    <span><strong>30 gün</strong> pulsuz qaytarma</span>
                    <span className="ticker-dot">•</span>
                    <span><strong>Gold Üzvlük</strong> ilə daha çox qazanın</span>
                    <span className="ticker-dot">•</span>
                    <span><strong>1.000.000+</strong> məhsul hazır stokda</span>
                    <span className="ticker-dot">•</span>
                    <span>Azərbaycanda <strong>5000+</strong> satıcı</span>
                </div>
            </div>
        </div>
    );
};

const listingIcons = [ShoppingBag, Camera, Smartphone, Shirt, HomeIcon, Dumbbell, BookOpen, CarFront, Apple, Wrench, Headphones, Gamepad2];

const MarketProductCard = ({ product, previewImage, index, calculateDiscountedPrice }) => {
    const navigate = useNavigate();
    const primaryImage = Array.isArray(product.imageUrls) && product.imageUrls.length > 0
        ? product.imageUrls[0]
        : previewImage;
    const ListingIcon = listingIcons[index % listingIcons.length];
    const isNew = product.isNew === true || product.isNew === 'true' || product.isNew === 1;
    const discountInfo = calculateDiscountedPrice(product.price);
    const hasDiscount = discountInfo.discountPercentage > 0;
    const currentPrice = hasDiscount ? discountInfo.discountedPrice : product.price;
    const formattedPrice = Number.isFinite(Number(currentPrice)) ? Number(currentPrice).toFixed(2) : '';
    const originalPriceFormatted = Number.isFinite(Number(product.price)) ? Number(product.price).toFixed(2) : '';

    const rating = index % 2 === 0 ? '★★★★★' : '★★★★☆';
    const reviewCount = index % 2 === 0 ? '(1.2k)' : '(430)';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            onClick={() => navigate(`/product/${product.id}`, { state: { previewImages: Array.isArray(product.imageUrls) ? product.imageUrls : (previewImage ? [previewImage] : []) } })}
            className="market-card"
        >
            {hasDiscount ? (
                <div className="badge-sale">-{discountInfo.discountPercentage}%</div>
            ) : isNew ? (
                <div className="badge-new">Yeni</div>
            ) : (
                <div className="badge-sale" style={{ background: 'var(--primary)' }}>Məhsul</div>
            )}
            <div className="market-product-img">
                {primaryImage ? (
                    <>
                        <img
                            src={primaryImage}
                            alt=""
                            aria-hidden="true"
                            style={{
                                position: 'absolute',
                                inset: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                filter: 'blur(14px)',
                                transform: 'scale(1.08)',
                                opacity: 0.45
                            }}
                        />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.3) 100%)' }} />
                        <img
                            src={primaryImage}
                            alt={product.title}
                            style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center' }}
                        />
                    </>
                ) : (
                    <span style={{ position: 'relative', zIndex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{ListingIcon ? <ListingIcon size={28} /> : null}</span>
                )}
                <button className="product-wishlist-btn" type="button" onClick={(e) => e.stopPropagation()}><Heart size={15} /></button>
            </div>
            <div className="market-product-body">
                <div className="market-product-brand">{product.category || 'General'}</div>
                <div className="market-product-name">{product.title}</div>
                <div className="market-product-price">
                    <div className="price-now">{formattedPrice} ₼</div>
                    {hasDiscount && <div className="price-old">{originalPriceFormatted} ₼</div>}
                </div>
                <div className="stars">{rating} <span>{reviewCount}</span></div>
            </div>
        </motion.div>
    );
};

export default Home;
