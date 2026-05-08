import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { CreditCard, ShieldCheck, Lock, ChevronLeft } from 'lucide-react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';

const FakePayment = () => {
    const { user } = useContext(AuthContext);
    const { clearCart } = useContext(CartContext);
    const navigate = useNavigate();
    const location = useLocation();
    const orderData = location.state?.orderData;
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        cardNumber: '',
        expiry: '',
        cvv: '',
        name: ''
    });

    const payableAmount = Number(orderData?.total ?? orderData?.price ?? 0);
    const originalAmount = Number(orderData?.originalTotal ?? orderData?.originalPrice ?? payableAmount);
    const hasDiscount = originalAmount > payableAmount;

    const handlePayment = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            // Fake delay for payment processing
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Create the actual order(s) in the backend
            if (user && orderData) {
                if (orderData.isBulk && orderData.items) {
                    // Handle bulk order from cart
                    const payload = orderData.bulkPayload || {
                        items: orderData.items.map(item => ({
                            productId: item.id,
                            quantity: item.quantity
                        })),
                        paymentMethod: orderData.paymentMethod || 'Kartla',
                        deliveryCity: orderData.deliveryCity,
                        discountCode: orderData.promoCode || null
                    };

                    await api.post(`/user/${user.id}/orders/bulk`, payload);
                    clearCart();
                } else {
                    // Handle single product order
                    await api.post(`/user/${user.id}/orders`, {
                        productId: orderData.id,
                        paymentMethod: 'Kartla',
                        deliveryCity: orderData.deliveryCity,
                        quantity: orderData.quantity || 1
                    });
                }
            }

            setLoading(false);
            alert('Ödəniş uğurla tamamlandı və sifarişiniz qəbul edildi!');
            navigate('/orders');
        } catch (error) {
            console.error('Payment/Order error:', error);
            setLoading(false);
            alert('Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.');
        }
    };

    return (
        <div className="container" style={{ padding: '3rem 20px', maxWidth: '600px' }}>
            <button 
                onClick={() => navigate(-1)} 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2rem', background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', fontWeight: 600 }}
            >
                <ChevronLeft size={20} /> Geri qayıt
            </button>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass"
                style={{ padding: '2.5rem', borderRadius: '24px' }}
            >
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ 
                        width: '60px', 
                        height: '60px', 
                        borderRadius: '50%', 
                        background: 'rgba(18,119,73,0.1)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        margin: '0 auto 1rem'
                    }}>
                        <CreditCard size={30} color="var(--primary)" />
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Onlayn Ödəniş</h2>
                    <p style={{ color: 'var(--text-light)', marginTop: '0.5rem' }}>Təhlükəsiz ödəniş sistemimiz vasitəsilə sifarişinizi tamamlayın.</p>
                </div>

                {orderData && (
                    <div style={{ background: 'rgba(0,0,0,0.03)', padding: '1rem', borderRadius: '14px', marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>Sifariş:</span>
                            <span style={{ fontWeight: 700 }}>{orderData.isBulk ? `${orderData.items.length} məhsul` : orderData.title}</span>
                        </div>
                        {hasDiscount && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-light)' }}>
                                <span>Əvvəlki məbləğ:</span>
                                <span style={{ textDecoration: 'line-through' }}>{originalAmount.toFixed(2)} ₼</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary)', fontWeight: 800 }}>
                            <span>Ödəniləcək məbləğ:</span>
                            <span>{payableAmount.toFixed(2)} ₼</span>
                        </div>
                    </div>
                )}

                <form onSubmit={handlePayment} style={{ display: 'grid', gap: '1.25rem' }}>
                    <div className="form-group">
                        <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem' }}>Kartın üzərindəki ad</label>
                        <input 
                            type="text" 
                            placeholder="ELCAN MURADOV"
                            required
                            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)' }}
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase()})}
                        />
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem' }}>Kart nömrəsi</label>
                        <div style={{ position: 'relative' }}>
                            <input 
                                type="text" 
                                placeholder="0000 0000 0000 0000"
                                required
                                maxLength="19"
                                style={{ width: '100%', padding: '14px', paddingLeft: '45px', borderRadius: '12px', border: '1px solid var(--border)' }}
                                value={formData.cardNumber}
                                onChange={(e) => setFormData({...formData, cardNumber: e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim()})}
                            />
                            <CreditCard size={20} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem' }}>Bitmə tarixi</label>
                            <input 
                                type="text" 
                                placeholder="MM/YY"
                                required
                                maxLength="5"
                                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)' }}
                                value={formData.expiry}
                                onChange={(e) => setFormData({...formData, expiry: e.target.value})}
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem' }}>CVV</label>
                            <div style={{ position: 'relative' }}>
                                <input 
                                    type="password" 
                                    placeholder="***"
                                    required
                                    maxLength="3"
                                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)' }}
                                    value={formData.cvv}
                                    onChange={(e) => setFormData({...formData, cvv: e.target.value})}
                                />
                                <Lock size={18} style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: '#ccc' }} />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-light)', fontSize: '0.85rem', marginTop: '1rem' }}>
                        <ShieldCheck size={20} color="var(--primary)" />
                        Məlumatlarınız SSL şifrələmə ilə qorunur.
                    </div>

                    <button 
                        type="submit" 
                        className="btn-primary" 
                        disabled={loading}
                        style={{ padding: '16px', borderRadius: '14px', fontWeight: 800, fontSize: '1.1rem', marginTop: '1rem' }}
                    >
                        {loading ? 'Gözləyin...' : `${payableAmount.toFixed(2)} AZN Ödə`}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default FakePayment;
