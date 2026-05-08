import React, { useContext, useEffect, useState } from 'react';
import { useToast } from '../components/Toast/ToastContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User as UserIcon,
    LogOut,
    Camera
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';

const PRODUCT_PREVIEW_CACHE_KEY = 'productImagePreviewCache';
const PROFILE_PHOTO_CACHE_KEY = 'userProfilePhotoCache';

const Profile = () => {
    const { user, logout } = useContext(AuthContext);
    const toast = useToast();
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('profil');

    // Password change state
    const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '' });
    const [updatingPassword, setUpdatingPassword] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    const compressImage = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1000;
                    const MAX_HEIGHT = 1000;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => {
                        if (!blob) {
                            reject(new Error("Canvas to Blob conversion failed"));
                            return;
                        }
                        resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: 'image/jpeg' }));
                    }, 'image/jpeg', 0.9);
                };
                img.onerror = reject;
            };
            reader.onerror = reject;
        });
    };

    const handlePhotoChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Optimistik yeniləmə - dərhal ekranda göstər
        const fakePreview = URL.createObjectURL(file);
        setProfile(prev => ({ ...prev, profileImageUrl: fakePreview }));
        
        // Cache the preview
        sessionStorage.setItem(PROFILE_PHOTO_CACHE_KEY, JSON.stringify({
            url: fakePreview,
            expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
        }));

        setUploadingPhoto(true);
        try {
            const compressed = await compressImage(file);
            
            const formData = new FormData();
            formData.append('file', compressed);

            // Backend-ə göndəririk. Backend 200 OK qaytaracaq, yükləmə background-da gedəcək.
            await api.put('/profile/changePhoto', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            // Background-da yükləndiyi üçün dərhal alert verməyə bilərik, yaxud "Yüklənir..." mesajı qala bilər.
            // setProfile(prev => ({ ...prev, profileImageUrl: imageUrl })); // Bu artıq backend tərəfindən async ediləcək
            
        } catch (error) {
            console.error('Profil şəkli dəyişdirilərkən xəta:', error);
            toast.error('Xəta baş verdi. Yenidən cəhd edin.');
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handlePasswordChange = async () => {
        if (!passwordData.oldPassword || !passwordData.newPassword) {
            toast.warning('Köhnə və yeni şifrəni daxil edin');
            return;
        }

        setUpdatingPassword(true);
        try {
            await api.post('/profile/change-password', passwordData);
            toast.success('Şifrə uğurla yeniləndi');
            setPasswordData({ oldPassword: '', newPassword: '' });
        } catch (error) {
            console.error('Şifrə dəyişdirilərkən xəta:', error);
            toast.error('Köhnə şifrə yanlışdır və ya xəta baş verdi');
        } finally {
            setUpdatingPassword(false);
        }
    };

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        const roleText = String(user.userRole || user.role || user.roles || user.authorities || '').toUpperCase();
        if (roleText.includes('SELLER')) {
            navigate('/seller/dashboard');
            return;
        }

        const fetchProfileData = async () => {
            try {
                const profileRes = await api.get('/profile');
                const data = profileRes.data.data;

                // Check for cached photo
                const cached = JSON.parse(sessionStorage.getItem(PROFILE_PHOTO_CACHE_KEY) || '{}');
                if (cached.url && cached.expiresAt > Date.now()) {
                    data.profileImageUrl = cached.url;
                }

                setProfile(data);
            } catch (error) {
                console.error("Profil məlumatları yüklənərkən xəta:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [user, navigate]);

    if (!user) return null;

    const isVerified = profile?.emailVerified || false;

    const mainTabs = [{ id: 'profil', icon: <UserIcon size={20} />, label: 'Profil' }];

    if (loading) {
        return (
            <div className="container" style={{ padding: '5rem 20px', textAlign: 'center' }}>
                <div className="animate-spin" style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                <p style={{ marginTop: '1rem', color: 'var(--text-light)' }}>Yüklənir...</p>
            </div>
        );
    }

    return (
        <>
        <div className="profile-container" style={{ backgroundColor: '#f6f7f8', minHeight: 'calc(100vh - 80px)', padding: '2rem 1rem' }}>
            <div className="container" style={{ maxWidth: '1000px' }}>


                {/* Main Tabs Navigation */}
                <div className="tabs-nav" style={{
                    display: 'flex', borderBottom: '1px solid #ddd', marginBottom: '1px',
                    overflowX: 'auto', backgroundColor: '#fff', borderRadius: '8px 8px 0 0',
                    scrollbarWidth: 'none'
                }}>
                    {mainTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '10px', padding: '1rem 1.5rem',
                                color: activeTab === tab.id ? 'var(--accent)' : '#666',
                                borderBottom: activeTab === tab.id ? '3px solid var(--accent)' : '3px solid transparent',
                                fontWeight: 600, fontSize: '0.95rem', transition: 'all 0.2s',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            <span style={{ color: activeTab === tab.id ? 'var(--accent)' : '#999' }}>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="content-area" style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '0 0 8px 8px', border: '1px solid #eee', borderTop: 'none', minHeight: '400px' }}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div style={{ color: '#999' }}>
                                <div style={{ textAlign: 'left', width: '100%', maxWidth: '500px', margin: '0 auto' }}>
                                            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '3rem' }}>
                                                <div style={{ position: 'relative', width: '100px', height: '100px', flexShrink: 0 }}>
                                                    {uploadingPhoto ? (
                                                        <div style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <div className="animate-spin" style={{ width: '24px', height: '24px', border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <img 
                                                                src={profile?.profileImageUrl || 'https://static.vecteezy.com/system/resources/previews/007/335/692/non_2x/account-icon-template-vector.jpg'} 
                                                                alt={profile?.name}
                                                                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '3px solid #fff', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
                                                            />
                                                            <label style={{ 
                                                                position: 'absolute', bottom: '0', right: '0', 
                                                                backgroundColor: 'var(--accent)', color: '#fff', 
                                                                width: '32px', height: '32px', borderRadius: '50%', 
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                                                                transition: 'transform 0.2s'
                                                            }}>
                                                                <Camera size={16} />
                                                                <input type="file" hidden accept="image/*" onChange={handlePhotoChange} />
                                                            </label>
                                                        </>
                                                    )}
                                                </div>
                                                <div>
                                                    <h2 style={{ fontSize: '1.4rem', color: '#333' }}>{profile?.name || user?.name}</h2>
                                                    <p style={{ color: '#666' }}>{profile?.email || user?.email}</p>
                                                    <p style={{ color: '#999', fontSize: '0.85rem', marginTop: '4px' }}>{profile?.phone}</p>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #eee', marginTop: '1rem' }}>
                                                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1.2rem', color: '#333' }}>Şifrəni dəyiş</h3>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                        <div>
                                                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', marginBottom: '4px' }}>Köhnə şifrə</label>
                                                            <input
                                                                type="password"
                                                                value={passwordData.oldPassword}
                                                                onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                                                                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', outline: 'none' }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', marginBottom: '4px' }}>Yeni şifrə</label>
                                                            <input
                                                                type="password"
                                                                value={passwordData.newPassword}
                                                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', outline: 'none' }}
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={handlePasswordChange}
                                                            disabled={updatingPassword}
                                                            style={{
                                                                backgroundColor: 'var(--accent)', color: '#fff', padding: '10px',
                                                                borderRadius: '4px', border: 'none', fontWeight: 600, cursor: 'pointer',
                                                                opacity: updatingPassword ? 0.7 : 1
                                                            }}
                                                        >
                                                            {updatingPassword ? 'Yüklənir...' : 'Şifrəni yenilə'}
                                                        </button>
                                                    </div>
                                                </div>

                                                <button onClick={logout} style={{
                                                    display: 'flex', alignItems: 'center', gap: '12px', padding: '1rem',
                                                    backgroundColor: '#fff5f5', color: '#e53e3e', borderRadius: '8px',
                                                    width: '100%', fontWeight: 600, border: '1px solid #fed7d7'
                                                }}>
                                                    <LogOut size={18} /> Hesabdan çıx
                                                </button>
                                            </div>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
            <style>{`
                @media (max-width: 768px) {
                    .profile-container { padding: 1rem 0 !important; }
                    .content-area { padding: 1rem !important; }
                    .product-item { flex-direction: column; align-items: stretch !important; gap: 1rem !important; }
                    .product-img { width: 100% !important; height: 180px !important; }
                    .product-actions { width: 100%; justify-content: space-between; border-top: 1px solid #eee; padding-top: 1rem; }
                    .product-actions button { flex: 1; text-align: center; }
                    .product-meta { flex-direction: column; align-items: flex-start !important; gap: 0.5rem !important; }
                }
                @media (max-width: 480px) {
                    .tabs-nav button { padding: 0.8rem 1rem !important; font-size: 0.85rem !important; }
                }
            `}</style>
        </>
    );
};

export default Profile;
