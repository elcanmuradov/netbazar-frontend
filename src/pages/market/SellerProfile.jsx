import React, { useState, useEffect, useContext } from 'react';
import { Camera, Upload, Save, User } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api/axios';
import './SellerDashboard.css';
import './SellerProfile.css';

const PHOTO_CACHE = 'sellerProfilePhotoCache';
const BANNER_CACHE = 'sellerBannerPhotoCache';

const SellerProfile = () => {
    const { user } = useContext(AuthContext);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(null); // 'photo' | 'banner' | null

    useEffect(() => {
        if (!user?.id) return;
        api.get(`/seller/profile/${user.id}`)
            .then(res => {
                const data = res.data?.data || {};
                // Apply cached images
                const cachedPhoto = JSON.parse(sessionStorage.getItem(PHOTO_CACHE) || '{}');
                if (cachedPhoto.url && cachedPhoto.expiresAt > Date.now()) data.profileImageUrl = cachedPhoto.url;
                const cachedBanner = JSON.parse(sessionStorage.getItem(BANNER_CACHE) || '{}');
                if (cachedBanner.url && cachedBanner.expiresAt > Date.now()) data.bannerImageUrl = cachedBanner.url;
                setProfile(data);
            })
            .catch(e => console.error('Profile fetch error', e))
            .finally(() => setLoading(false));
    }, [user?.id]);

    const handleUpload = async (e, type) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(type);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const endpoint = type === 'banner' ? '/seller/profile/banner' : '/seller/profile/photo';
            await api.put(endpoint, formData);

            const fakeUrl = URL.createObjectURL(file);
            const cacheKey = type === 'banner' ? BANNER_CACHE : PHOTO_CACHE;
            sessionStorage.setItem(cacheKey, JSON.stringify({ url: fakeUrl, expiresAt: Date.now() + 10 * 60 * 1000 }));

            setProfile(prev => ({
                ...prev,
                [type === 'banner' ? 'bannerImageUrl' : 'profileImageUrl']: fakeUrl
            }));
        } catch { alert('Yükləmə zamanı xəta baş verdi'); }
        finally { setUploading(null); }
    };

    if (loading) return <div className="seller-loading">Profil yüklənir...</div>;
    if (!profile) return <div className="seller-loading">Profil tapılmadı.</div>;

    return (
        <div className="seller-page">
            <div className="seller-page-header">
                <h1>Profil</h1>
                <p>Mağaza məlumatlarınızı idarə edin</p>
            </div>

            {/* Banner */}
            <div className="sp-banner-section glass">
                <div
                    className="sp-banner"
                    style={{
                        backgroundImage: profile.bannerImageUrl
                            ? `url(${profile.bannerImageUrl})`
                            : 'linear-gradient(135deg, rgba(18,119,73,0.18), rgba(175,134,47,0.28))',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    <label className={`sp-upload-btn ${uploading === 'banner' ? 'loading' : ''}`}>
                        <input type="file" accept="image/*" style={{ display: 'none' }}
                            onChange={e => handleUpload(e, 'banner')} disabled={!!uploading} />
                        <Upload size={15} />
                        {uploading === 'banner' ? 'Yüklənir...' : 'Banner dəyiş'}
                    </label>
                </div>

                {/* Avatar */}
                <div className="sp-avatar-row">
                    <label className="sp-avatar-wrap">
                        <input type="file" accept="image/*" style={{ display: 'none' }}
                            onChange={e => handleUpload(e, 'photo')} disabled={!!uploading} />
                        <div className="sp-avatar">
                            {profile.profileImageUrl ? (
                                <img src={profile.profileImageUrl} alt={profile.name} />
                            ) : (
                                <User size={36} />
                            )}
                            <div className="sp-avatar-overlay">
                                <Camera size={18} />
                            </div>
                        </div>
                    </label>
                    <div className="sp-identity">
                        <h2>{profile.name}</h2>
                        <p>{profile.email}</p>
                        <span className={`seller-status-badge ${profile.status === 'ACTIVE' ? 'status-delivered' : 'status-cancelled'}`}>
                            {profile.status === 'ACTIVE' ? 'Aktiv' : profile.status}
                        </span>
                    </div>
                </div>
            </div>

            {/* Info cards */}
            <div className="sp-info-grid">
                {[
                    ['Ad',    profile.name  || '—'],
                    ['Email', profile.email || '—'],
                    ['Telefon', profile.phone || '—'],
                    ['Status', profile.status || '—'],
                ].map(([label, val]) => (
                    <div key={label} className="sp-info-card glass">
                        <div className="sp-info-label">{label}</div>
                        <div className="sp-info-value">{val}</div>
                    </div>
                ))}
            </div>


        </div>
    );
};

export default SellerProfile;
