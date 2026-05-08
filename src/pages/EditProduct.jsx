import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, MapPin, Tag, Info, Check, ArrowLeft, ArrowRight, GripVertical } from 'lucide-react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';

const EditProduct = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [images, setImages] = useState([]); // { imageUrl, publicId }

    const categories = [
        "Elektronika", "Geyim", "Ev & Bağ", "Uşaq aləmi", "İdman", "Avtomobillər",
        "Kitab", "Gözəllik & Sağlamlıq", "Oyuncaqlar", "Qida & İçki", "Heyvanlar aləmi",
        "İncəsənət", "Biznes", "Xidmətlər", "Digər"
    ];

    const cities = [
        "Bakı", "Gəncə", "Sumqayıt", "Mingəçevir", "Şəki", "Yevlax", "Lənkəran", "Şirvan", "Naftalan", "Şuşa", "Xankəndi",
        "Abşeron", "Ağcabədi", "Ağdam", "Ağdaş", "Ağstafa", "Ağsu", "Astara", "Balakən", "Bərdə", "Beyləqan", "Biləsuvar",
        "Cəbrayıl", "Cəlilabad", "Daşkəsən", "Füzuli", "Gədəbəy", "Goranboy", "Göyçay", "Göygöl", "Hacıqabul", "İmişli",
        "İsmayıllı", "Kəlbəcər", "Kürdəmir", "Laçın", "Lerik", "Masallı", "Neftçala", "Oğuz", "Qəbələ", "Qax", "Qazax",
        "Qobustan", "Quba", "Qubadlı", "Qusar", "Saatlı", "Sabirabad", "Salyan", "Şamaxı", "Şəmkir", "Siyəzən", "Tərtər",
        "Tovuz", "Ucar", "Xaçmaz", "Xızı", "Xocalı", "Xocavənd", "Yardımlı", "Zəngilan", "Zaqatala", "Zərdab",
        "Naxçıvan (Şəhər)", "Babək", "Culfa", "Kəngərli", "Ordubad", "Sədərək", "Şahbuz", "Şərur"
    ];

    const [formData, setFormData] = useState({
        title: '',
        categoryId: 0,
        price: '',
        description: '',
        cityId: 0,
        isNew: false,
        isDelivery: false
    });

    const isNewProduct = formData.isNew === true;
    const hasDelivery = formData.isDelivery === true;

    const reorderImages = (fromIndex, toIndex) => {
        if (fromIndex === toIndex || toIndex < 0 || toIndex >= images.length) return;
        setImages((prev) => {
            const next = [...prev];
            const [moved] = next.splice(fromIndex, 1);
            next.splice(toIndex, 0, moved);
            return next;
        });
    };

    const moveImageToPosition = (fromIndex, toPosition) => {
        const targetIndex = Number(toPosition) - 1;
        if (Number.isNaN(targetIndex) || targetIndex < 0 || targetIndex >= images.length) return;
        reorderImages(fromIndex, targetIndex);
    };

    const removeImage = (index) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
    };

    useEffect(() => {
        const fetchProductData = async () => {
            if (!user) return;
            try {
                // Not: Product service-dəki GETById endpointi istifadə edilir
                const res = await api.get(`/user/${user.id}/product/${productId}`);
                const p = res.data.data;
                
                // Form məlumatlarını doldur
                setFormData({
                    title: p.title || '',
                    categoryId: categories.indexOf(p.category) !== -1 ? categories.indexOf(p.category) : 0,
                    price: p.price || '',
                    description: p.description || '',
                    cityId: cities.indexOf(p.city) !== -1 ? cities.indexOf(p.city) : 0,
                    isNew: p.isNew === true || p.isNew === 'true' || p.isNew === 1,
                    isDelivery: p.isDelivery === true || p.isDelivery === 'true' || p.isDelivery === 1
                });

                setImages((p.imageUrls || []).map((url) => ({ imageUrl: url, publicId: null })));
            } catch (err) {
                console.error("Məhsul yüklənərkən xəta:", err);
                setError("Məhsul məlumatlarını yükləmək mümkün olmadı.");
            } finally {
                setLoading(false);
            }
        };

        fetchProductData();
    }, [productId, user]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const payload = {
                ...formData,
                price: parseFloat(formData.price),
                categoryId: parseInt(formData.categoryId),
                cityId: parseInt(formData.cityId),
                images,
                userId: user.id
            };

            await api.put(`/user/${user.id}/product/${productId}/update`, payload);
            alert("Məhsul uğurla yeniləndi!");
            navigate("/seller/dashboard");
        } catch (err) {
            console.error("Yeniləmə xətası:", err);
            alert("Xəta baş verdi: " + (err.response?.data?.message || "Yenidən cəhd edin."));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="container" style={{ padding: '5rem', textAlign: 'center' }}>Yüklənir...</div>;
    if (error) return <div className="container" style={{ padding: '5rem', textAlign: 'center', color: 'red' }}>{error}</div>;

    return (
        <div className="container" style={{ padding: '3rem 20px', maxWidth: '800px' }}>
            <button 
                onClick={() => navigate(-1)} 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: 'none', color: 'var(--text-light)', marginBottom: '1.5rem', cursor: 'pointer' }}
            >
                <ArrowLeft size={18} /> Geri qayıt
            </button>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass"
                style={{ padding: '2.5rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}
            >
                <h1 style={{ marginBottom: '0.5rem', color: 'var(--primary)' }}>Elana Düzəliş Et</h1>
                <p style={{ color: 'var(--text-light)', marginBottom: '2.5rem' }}>Məhsul məlumatlarını yeniləyin.</p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Camera size={18} /> Şəkil sırası
                        </label>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '-0.25rem' }}>
                            Burada sıraladığınız ardıcıllıq backend-də saxlanacaq və məhsulda eyni görünəcək.
                        </div>

                        {images.length === 0 ? (
                            <div style={{ border: '1px dashed var(--border)', borderRadius: '10px', padding: '14px', color: 'var(--text-light)' }}>
                                Şəkil yoxdur.
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1rem' }}>
                                {images.map((img, idx) => (
                                    <div
                                        key={`${img.imageUrl}-${idx}`}
                                        style={{
                                            position: 'relative',
                                            aspectRatio: '1',
                                            borderRadius: '12px',
                                            overflow: 'hidden',
                                            border: '1px solid rgba(0,0,0,0.08)',
                                            backgroundColor: '#fff',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                        }}
                                    >
                                        <img src={img.imageUrl} alt={`Məhsul şəkli ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <div style={{ position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(17,62,33,0.9)', color: '#fff', borderRadius: '999px', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700 }}>
                                            {idx + 1}
                                        </div>

                                        <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: '4px', alignItems: 'center' }}>
                                            <select
                                                value={idx + 1}
                                                onChange={(e) => moveImageToPosition(idx, e.target.value)}
                                                title="Sıra seç"
                                                style={{
                                                    height: 24,
                                                    borderRadius: '999px',
                                                    border: 'none',
                                                    backgroundColor: 'rgba(255,255,255,0.95)',
                                                    padding: '0 8px',
                                                    fontSize: '0.72rem',
                                                    fontWeight: 700,
                                                    color: '#333',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {images.map((_, positionIdx) => (
                                                    <option key={positionIdx} value={positionIdx + 1}>
                                                        {positionIdx + 1}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => reorderImages(idx, idx - 1)}
                                                disabled={idx === 0}
                                                title="Yuxarı"
                                                style={{ width: 24, height: 24, borderRadius: '50%', border: 'none', backgroundColor: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.45 : 1 }}
                                            >
                                                <ArrowLeft size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => reorderImages(idx, idx + 1)}
                                                disabled={idx === images.length - 1}
                                                title="Aşağı"
                                                style={{ width: 24, height: 24, borderRadius: '50%', border: 'none', backgroundColor: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: idx === images.length - 1 ? 'not-allowed' : 'pointer', opacity: idx === images.length - 1 ? 0.45 : 1 }}
                                            >
                                                <ArrowRight size={14} />
                                            </button>
                                        </div>

                                        <div style={{ position: 'absolute', bottom: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.42)', color: '#fff', borderRadius: '999px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem' }}>
                                            <GripVertical size={12} /> Sıra
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => removeImage(idx)}
                                            style={{ position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(239,68,68,0.92)', color: 'white', border: 'none', borderRadius: '50%', width: 26, height: 26, cursor: 'pointer', fontSize: '12px' }}
                                        >✕</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={labelStyle}><Tag size={16} /> Başlıq</label>
                            <input type="text" name="title" value={formData.title} onChange={handleChange} required style={inputStyle} />
                        </div>

                        <div>
                            <label style={labelStyle}>Kateqoriya</label>
                            <select name="categoryId" value={formData.categoryId} onChange={handleChange} style={inputStyle}>
                                {categories.map((cat, idx) => (
                                    <option key={idx} value={idx}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={labelStyle}>Qiymət (₼)</label>
                            <input type="number" name="price" value={formData.price} onChange={handleChange} required min="0.01" step="0.01" style={inputStyle} />
                        </div>

                        <div style={{ display: 'flex', gap: '2rem', gridColumn: 'span 2', padding: '10px 0', flexWrap: 'wrap' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 500 }}>
                                <input type="checkbox" name="isNew" checked={formData.isNew} onChange={handleChange} style={{ width: 18, height: 18 }} />
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
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
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 500 }}>
                                <input type="checkbox" name="isDelivery" checked={formData.isDelivery} onChange={handleChange} style={{ width: 18, height: 18 }} />
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
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
                            </label>
                        </div>

                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={labelStyle}><Info size={16} /> Təsvir</label>
                            <textarea name="description" value={formData.description} onChange={handleChange} rows="5" style={inputStyle}></textarea>
                        </div>

                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={labelStyle}><MapPin size={16} /> Şəhər</label>
                            <select name="cityId" value={formData.cityId} onChange={handleChange} style={inputStyle}>
                                {cities.map((city, idx) => (
                                    <option key={idx} value={idx}>{city}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button type="submit" disabled={submitting} className="btn-primary" style={{ justifyContent: 'center', width: '100%', padding: '15px', opacity: submitting ? 0.7 : 1 }}>
                        <Check size={20} /> {submitting ? "Yenilənir..." : "Dəyişiklikləri Saxla"}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

const labelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: 600,
    fontSize: '0.9rem',
    marginBottom: '0.5rem',
    color: 'var(--primary)'
};

const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    backgroundColor: '#fff',
    outline: 'none',
    fontSize: '1rem'
};

export default EditProduct;
