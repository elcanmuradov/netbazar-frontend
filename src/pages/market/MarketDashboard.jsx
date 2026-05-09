import React, { useState, useEffect, useContext } from 'react';
import { useToast } from '../../components/Toast/ToastContext';
import { motion } from 'framer-motion';
import { BarChart3, Package, Truck, CreditCard, Camera, ShoppingBag, Upload, Bell } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api/axios';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';

const SELLER_PHOTO_CACHE_KEY = 'sellerProfilePhotoCache';
const SELLER_BANNER_CACHE_KEY = 'sellerBannerPhotoCache';

const MarketDashboard = () => {
    const { user, token } = useContext(AuthContext);
    const toast = useToast();
    const [dashboard, setDashboard] = useState(null);
    const [sellerProfile, setSellerProfile] = useState(null);
    const [myProducts, setMyProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [notifications, setNotifications] = useState([]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            
            if (!user?.id) {
                setError('Satıcı ID tapılmadı');
                setLoading(false);
                return;
            }

            // Fetch dashboard stats
            const dashboardResponse = await api.get(`/seller/dashboard/${user.id}`);
            
            if (dashboardResponse.data?.data) {
                setDashboard(dashboardResponse.data.data);
                setError(null);
            } else {
                throw new Error('Dashboard məlumatları gəlmədi');
            }

            // Fetch seller profile
            try {
                const profileResponse = await api.get(`/seller/profile/${user.id}`);
                if (profileResponse.data?.data) {
                    const data = profileResponse.data.data;
                    
                    // Check for cached photo
                    const cachedPhoto = JSON.parse(sessionStorage.getItem(SELLER_PHOTO_CACHE_KEY) || '{}');
                    if (cachedPhoto.url && cachedPhoto.expiresAt > Date.now()) {
                        data.profileImageUrl = cachedPhoto.url;
                    }
                    
                    // Check for cached banner
                    const cachedBanner = JSON.parse(sessionStorage.getItem(SELLER_BANNER_CACHE_KEY) || '{}');
                    if (cachedBanner.url && cachedBanner.expiresAt > Date.now()) {
                        data.bannerImageUrl = cachedBanner.url;
                    }

                    setSellerProfile(data);
                }
            } catch (profileError) {
                console.warn('Could not fetch seller profile:', profileError);
            }

            // Fetch seller products
            try {
                const productsResponse = await api.get(`/user/${user.id}/product`, {
                    params: { size: 50 }
                });
                if (productsResponse.data?.data?.content) {
                    setMyProducts(productsResponse.data.data.content);
                }
            } catch (prodError) {
                console.error('Could not fetch seller products:', prodError);
            }
        } catch (err) {
            console.error('Dashboard məlumatı yükləmə xətası:', err);
            setError('Dashboard məlumatları yüklənə bilmədi');
            setDashboard({
                stats: {
                    activeProducts: 0,
                    dailyOrders: 0,
                    ordersInProgress: 0,
                    revenueToday: '0 AZN'
                },
                orders: [],
                paymentMethods: ['Nəğd', 'Kartla']
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [user?.id]);

    useEffect(() => {
        if (!token || !user) return;

        const socket = new SockJS('/api/chat/ws');
        const stompClient = new Client({
            webSocketFactory: () => socket,
            connectHeaders: { Authorization: `Bearer ${token}` },
            onConnect: () => {
                stompClient.subscribe('/user/queue/notifications', (msg) => {
                    const payload = JSON.parse(msg.body);
                    if (payload.type === 'NEW_ORDER') {
                        // Add to local notifications
                        setNotifications(prev => [{
                            id: Date.now(),
                            message: payload.message,
                            time: new Date().toLocaleTimeString()
                        }, ...prev]);

                        // Refresh dashboard data without full loading state if possible
                        // But fetchDashboardData has setLoading(true) which might be jarring.
                        // Let's make a softer refresh.
                        softRefreshData();
                    }
                });
            },
            onStompError: (frame) => console.error('STOMP error', frame.headers['message'])
        });

        const softRefreshData = async () => {
            try {
                const res = await api.get(`/seller/dashboard/${user.id}`);
                if (res.data?.data) {
                    setDashboard(res.data.data);
                }
            } catch (e) {
                console.error("Soft refresh failed", e);
            }
        };

        stompClient.activate();

        return () => {
            if (stompClient) stompClient.deactivate();
        };
    }, [token, user?.id]);

    const handlePhotoUpload = async (e, type) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset input so the same file can be reselected
        e.target.value = '';

        // Local preview that we keep until a real URL comes back from the server
        const previewUrl = URL.createObjectURL(file);
        const fieldKey = type === 'banner' ? 'bannerImageUrl' : 'profileImageUrl';
        const cacheKey = type === 'banner' ? SELLER_BANNER_CACHE_KEY : SELLER_PHOTO_CACHE_KEY;

        try {
            setUploading(true);

            // Optimistic update first, so user sees instant feedback
            setSellerProfile(prev => ({ ...(prev || {}), [fieldKey]: previewUrl }));

            const formData = new FormData();
            formData.append('file', file);

            const endpoint = type === 'banner' ? '/seller/profile/banner' : '/seller/profile/photo';
            // Do NOT set Content-Type manually — axios interceptor strips it so the browser
            // can add the proper multipart boundary. Setting it here breaks the upload.
            const response = await api.put(endpoint, formData);

            if (!response?.data?.success) {
                throw new Error(response?.data?.message || 'Server xəta qaytardı');
            }

            // Refresh profile data — keep optimistic preview if backend hasn't returned the new URL yet
            try {
                const profileResponse = await api.get(`/seller/profile/${user.id}`);
                const fresh = profileResponse?.data?.data;
                if (fresh) {
                    const serverUrl = fresh[fieldKey];
                    setSellerProfile(prev => ({
                        ...fresh,
                        // If the server URL is missing/blank, keep the local preview so the image doesn't disappear
                        [fieldKey]: serverUrl && serverUrl.trim() !== '' ? serverUrl : previewUrl,
                    }));

                    if (serverUrl && serverUrl.trim() !== '') {
                        sessionStorage.setItem(cacheKey, JSON.stringify({
                            url: serverUrl,
                            expiresAt: Date.now() + 10 * 60 * 1000,
                        }));
                    }
                }
            } catch (refetchErr) {
                console.warn('Profile refetch after upload failed; keeping local preview', refetchErr);
            }

            toast.success(`${type === 'banner' ? 'Banner' : 'Profil fotosu'} yükləndi`);
        } catch (err) {
            // Roll back optimistic update on hard failure
            setSellerProfile(prev => ({ ...(prev || {}), [fieldKey]: prev?.[fieldKey] === previewUrl ? null : prev?.[fieldKey] }));
            const status = err?.response?.status;
            const serverMsg = err?.response?.data?.message;
            console.error(`Error uploading ${type}:`, status, serverMsg, err);
            toast.error(`${type === 'banner' ? 'Banner' : 'Profil fotosu'} yükləmə xətası${serverMsg ? ': ' + serverMsg : ''}`);
        } finally {
            setUploading(false);
        }
    };

    const stats = dashboard?.stats ? [
        { label: 'Aktiv məhsul', value: dashboard.stats.activeProducts || '0', icon: Package },
        { label: 'Gündəlik sifariş', value: dashboard.stats.dailyOrders || '0', icon: ShoppingBag },
        { label: 'Hazırlanır', value: dashboard.stats.ordersInProgress || '0', icon: Truck },
        { 
            label: 'Ödəniş dövriyyəsi', 
            value: dashboard.stats.revenueToday ? 
                (typeof dashboard.stats.revenueToday === 'object' ? 
                    `${dashboard.stats.revenueToday.toString()} AZN` : 
                    `${dashboard.stats.revenueToday} AZN`) : '0 AZN', 
            icon: CreditCard 
        }
    ] : [];

    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            await api.put(`/seller/order/${orderId}/status`, null, {
                params: { status: newStatus }
            });
            // Update local state
            setDashboard(prev => ({
                ...prev,
                orders: prev.orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
            }));
            toast.success('Sifariş statusu yeniləndi');
        } catch (err) {
            console.error('Status yeniləmə xətası:', err);
            toast.error('Status yenilənə bilmədi');
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            return d.toLocaleString('az-AZ', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).replace(',', ' |');
        } catch (e) {
            return dateStr;
        }
    };

    const orders = dashboard?.orders || [];
    const paymentMethods = dashboard?.paymentMethods || ['Nəğd', 'Kartla'];

    if (loading) {
        return (
            <div className="container" style={{ padding: '3rem 20px', maxWidth: '1200px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-light)' }}>Dashboard məlumatları yüklənir...</p>
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '3rem 20px', maxWidth: '1200px' }}>
            {/* Real-time Notifications */}
            {notifications.length > 0 && (
                <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {notifications.map(note => (
                        <motion.div 
                            key={note.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="glass"
                            style={{ 
                                padding: '1rem 1.5rem', 
                                borderLeft: '4px solid var(--accent)', 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                background: 'rgba(175,134,47,0.08)'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Bell size={20} color="var(--accent)" />
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{note.message}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{note.time}</div>
                                </div>
                            </div>
                            <button 
                                onClick={() => setNotifications(prev => prev.filter(n => n.id !== note.id))}
                                style={{ background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', padding: '4px' }}
                            >
                                Bağla
                            </button>
                        </motion.div>
                    ))}
                </div>
            )}

            {error && (
                <div style={{ padding: '1rem', marginBottom: '1.5rem', background: 'rgba(239,68,68,0.1)', borderRadius: '12px', color: '#ef4444' }}>
                    {error}
                </div>
            )}
            
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass"
                style={{ borderRadius: '24px', overflow: 'hidden', marginBottom: '1.5rem', position: 'relative' }}
            >
                {/* Banner Section */}
                <div 
                    style={{ 
                        minHeight: '220px', 
                        background: sellerProfile?.bannerImageUrl ? 
                            `url(${sellerProfile.bannerImageUrl})` :
                            'linear-gradient(135deg, rgba(18,119,73,0.14), rgba(175,134,47,0.22))',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        padding: '2rem', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        gap: '1rem', 
                        flexWrap: 'wrap', 
                        alignItems: 'end',
                        position: 'relative'
                    }}
                >
                    <label 
                        style={{
                            position: 'absolute',
                            top: '1rem',
                            right: '1rem',
                            cursor: uploading ? 'not-allowed' : 'pointer',
                            opacity: uploading ? 0.5 : 1
                        }}
                    >
                        <input 
                            type="file" 
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => handlePhotoUpload(e, 'banner')}
                            disabled={uploading}
                        />
                        <div style={{ 
                            padding: '0.5rem 1rem', 
                            background: 'rgba(255,255,255,0.9)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontWeight: 600,
                            fontSize: '0.9rem'
                        }}>
                            <Upload size={16} />
                            {uploading ? 'Yüklənir...' : 'Banner dəyiş'}
                        </div>
                    </label>

                    <div style={{ flex: 1 }}></div>

                    <label style={{ cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.5 : 1 }}>
                        <input 
                            type="file" 
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => handlePhotoUpload(e, 'photo')}
                            disabled={uploading}
                        />
                        <div style={{ width: '88px', height: '88px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.2s' }}>
                            {sellerProfile?.profileImageUrl ? (
                                <img src={sellerProfile.profileImageUrl} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                                <Camera size={34} color="var(--primary)" />
                            )}
                        </div>
                    </label>
                </div>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.label} className="glass" style={{ padding: '1rem', borderRadius: '18px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <div>
                                    <p style={{ color: 'var(--text-light)', marginBottom: '0.35rem' }}>{stat.label}</p>
                                    <h2 style={{ fontSize: '1.5rem', color: 'var(--text)' }}>{stat.value}</h2>
                                </div>
                                <Icon color="var(--primary)" />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.9fr', gap: '1rem' }}>
                <div className="glass" style={{ padding: '1.25rem', borderRadius: '18px' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Sifarişlər</h3>
                    <div style={{ display: 'grid', gap: '0.85rem' }}>
                        {orders.length === 0 ? (
                            <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '1rem' }}>Hənüz sifariş yoxdur</p>
                        ) : (
                            orders.map((order) => (
                                <div key={order.id} style={{ padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border)', background: '#fff' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                <strong style={{ fontSize: '1rem' }}>#{order.id.substring(0, 8)}</strong>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{formatDate(order.createdAt)}</span>
                                            </div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>Məhsul: {order.productTitle || 'Məhsul adı yoxdur'} (x{order.quantity || 1})</div>
                                            <div style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>Müştəri: {order.customer}</div>
                                            <div style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>{order.payment} · {order.delivery} | Toplam: {order.totalPrice} ₼</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ 
                                                fontWeight: 800, 
                                                color: order.status === 'DELIVERED' ? 'var(--primary)' : 'var(--accent)',
                                                background: order.status === 'DELIVERED' ? 'rgba(18,119,73,0.1)' : 'rgba(175,134,47,0.1)',
                                                padding: '4px 12px',
                                                borderRadius: '20px',
                                                fontSize: '0.85rem',
                                                display: 'inline-block'
                                            }}>
                                                {order.status === 'RECEIVED' ? 'Qəbul edildi' :
                                                 order.status === 'PREPARING' ? 'Hazırlanır' :
                                                 order.status === 'SHIPPING' ? 'Yoldadır' :
                                                 order.status === 'DELIVERED' ? 'Çatdırılıb' : order.status}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {order.status === 'RECEIVED' && (
                                            <button onClick={() => handleUpdateStatus(order.id, 'PREPARING')} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Hazırla</button>
                                        )}
                                        {order.status === 'PREPARING' && (
                                            <button onClick={() => handleUpdateStatus(order.id, 'SHIPPING')} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Yola sal</button>
                                        )}
                                        {order.status === 'SHIPPING' && (
                                            <button onClick={() => handleUpdateStatus(order.id, 'DELIVERED')} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Çatdırıldı</button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div style={{ display: 'grid', gap: '1rem' }}>
                    <div className="glass" style={{ padding: '1.25rem', borderRadius: '18px' }}>
                        <h3 style={{ marginBottom: '0.85rem' }}>Ödəniş sistemi</h3>
                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                            {paymentMethods.map((method) => (
                                <div key={method} style={{ padding: '0.9rem', borderRadius: '12px', border: '1px solid var(--border)', background: '#fff' }}>
                                    {method}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass" style={{ padding: '1.25rem', borderRadius: '18px' }}>
                        <h3 style={{ marginBottom: '0.85rem' }}>Statistika</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <BarChart3 color="var(--primary)" />
                            <span style={{ color: 'var(--text-light)' }}>Məhsul baxışları, sifariş dönüşümü və çatdırılma performansı.</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* My Products Section */}
            <div className="glass" style={{ padding: '1.5rem', borderRadius: '24px', marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3>Məhsullarım</h3>
                    <button 
                        onClick={() => window.location.href = '/add-product'}
                        className="btn-primary" 
                        style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                    >
                        + Yeni Məhsul
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                    {myProducts.length === 0 ? (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
                            <ShoppingBag size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                            <p>Hələ heç bir məhsulunuz yoxdur.</p>
                        </div>
                    ) : (
                        myProducts.map(product => (
                            <div 
                                key={product.id} 
                                className="product-card" 
                                style={{ 
                                    background: '#fff', 
                                    borderRadius: '16px', 
                                    border: '1px solid var(--border)',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}
                            >
                                <div style={{ height: '180px', overflow: 'hidden', position: 'relative' }}>
                                    <img 
                                        src={product.imageUrls?.[0] || 'https://via.placeholder.com/300x200?text=No+Image'} 
                                        alt={product.title} 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                    <div style={{ 
                                        position: 'absolute', 
                                        top: '10px', 
                                        right: '10px',
                                        padding: '4px 8px',
                                        background: 'rgba(255,255,255,0.9)',
                                        borderRadius: '6px',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        color: 'var(--primary)'
                                    }}>
                                        {product.price} AZN
                                    </div>
                                </div>
                                <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>{product.title}</h4>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '1rem', flex: 1 }}>
                                        {product.category} · {product.city}
                                    </p>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button 
                                            onClick={() => window.location.href = `/edit-product/${product.id}`}
                                            style={{ 
                                                flex: 1, 
                                                padding: '0.5rem', 
                                                borderRadius: '8px', 
                                                border: '1px solid var(--primary)', 
                                                background: 'transparent',
                                                color: 'var(--primary)',
                                                fontWeight: 600,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Redaktə et
                                        </button>
                                        <button 
                                            onClick={async () => {
                                                if (window.confirm('Bu məhsulu silmək istədiyinizə əminsiniz?')) {
                                                    try {
                                                        await api.delete(`/user/${user.id}/product/${product.id}/delete`);
                                                        setMyProducts(prev => prev.filter(p => p.id !== product.id));
                                                        toast.success('Məhsul silindi');
                                                    } catch (err) {
                                                        toast.error('Silinmə zamanı xəta baş verdi');
                                                    }
                                                }
                                            }}
                                            style={{ 
                                                padding: '0.5rem', 
                                                borderRadius: '8px', 
                                                border: 'none', 
                                                background: 'rgba(239,68,68,0.1)',
                                                color: '#ef4444',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Sil
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default MarketDashboard;
