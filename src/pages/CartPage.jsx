import React, { useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, ShoppingBag, CreditCard, Package, ChevronLeft, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';

const CartPage = () => {
    const { cartItems, removeFromCart, updateQuantity, getCartTotal, clearCart } = useContext(CartContext);
    const { user, token } = useContext(AuthContext);
    const navigate = useNavigate();
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [orderForm, setOrderForm] = useState({ paymentMethod: 'Kartla', deliveryCity: 'Bakı', promoCode: '', selectedSeller: null });
    const [isOrderingAction, setIsOrderingAction] = useState(false);
    const [appliedDiscount, setAppliedDiscount] = useState(null);
    const [promoError, setPromoError] = useState('');
    const [isValidatingPromo, setIsValidatingPromo] = useState(false);
    const [sellerSearchResults, setSellerSearchResults] = useState([]);
    const [isSearchingSellers, setIsSearchingSellers] = useState(false);
    const [showSellerDropdown, setShowSellerDropdown] = useState(false);

    const applyPromoCode = async () => {
    if (!orderForm.promoCode.trim()) {
        setPromoError('Promo kod daxil edin');
        return;
    }

    setIsValidatingPromo(true);
    setPromoError('');
    try {
        const response = await api.get(`/discounts/validate/${orderForm.promoCode.toUpperCase()}`, {
            params: { totalAmount: getCartTotal() }
        });
        const validation = response.data?.data; // ApiResponse wraps data
        if (validation?.valid) {
            setAppliedDiscount(validation);
        } else {
            setPromoError(validation?.message || 'Promo kod etibarsızdır');
        }
    } catch (error) {
        setPromoError(error.response?.data?.message || 'Promo kod etibarsızdır');
    } finally {
        setIsValidatingPromo(false);
    }
};

    const searchSellers = async (query) => {
        if (!query.trim()) {
            setSellerSearchResults([]);
            return;
        }

        setIsSearchingSellers(true);
        try {
            const response = await api.get('/sellers/search', {
                params: { query: query }
            });
            setSellerSearchResults(response.data?.data || []);
            setShowSellerDropdown(true);
        } catch (error) {
            console.error('Satıcı axtarışı xətası:', error);
            setSellerSearchResults([]);
        } finally {
            setIsSearchingSellers(false);
        }
    };

    const handleSellerSelect = (seller) => {
        setOrderForm(prev => ({
            ...prev,
            selectedSeller: seller,
            promoCode: ''
        }));
        setSellerSearchResults([]);
        setShowSellerDropdown(false);
        setPromoError('');
        setAppliedDiscount(null);
    };

    const handleSellerInputChange = (e) => {
        const value = e.target.value;
        setOrderForm(prev => ({
            ...prev,
            selectedSeller: null,
            promoCode: value
        }));
        setPromoError('');
        setAppliedDiscount(null);
        
        if (value.trim()) {
            searchSellers(value);
        } else {
            setSellerSearchResults([]);
            setShowSellerDropdown(false);
        }
    };

    const removePromoCode = () => {
        setAppliedDiscount(null);
        setOrderForm(prev => ({ ...prev, promoCode: '', selectedSeller: null }));
        setPromoError('');
    };

    const calculateTotal = () => {
        let total = getCartTotal();
        if (appliedDiscount) {
            if (appliedDiscount.type === 'PERCENTAGE') {
                total -= (total * appliedDiscount.value) / 100;
            } else {
                total -= appliedDiscount.value;
            }
        }
        return Math.max(0, total);
    };

    const handleCheckout = () => {
        if (!user || !token) {
            navigate('/login');
            return;
        }
        setOrderForm({ paymentMethod: 'Kartla', deliveryCity: 'Bakı', promoCode: '', selectedSeller: null });
        setAppliedDiscount(null);
        setPromoError('');
        setSellerSearchResults([]);
        setShowSellerDropdown(false);
        setIsOrderModalOpen(true);
    };

    const handleOrderSubmit = async (e) => {
        e.preventDefault();
        setIsOrderingAction(true);

        const bulkPayload = {
            items: cartItems.map(item => ({
                productId: item.id,
                quantity: item.quantity
            })),
            paymentMethod: orderForm.paymentMethod,
            deliveryCity: orderForm.deliveryCity,
            discountCode: appliedDiscount ? orderForm.promoCode : null
        };

        try {
            const finalTotal = calculateTotal();
            
            if (orderForm.paymentMethod === 'Kartla') {
                navigate('/payment', { 
                    state: { 
                        orderData: {
                            isBulk: true,
                            items: cartItems,
                            total: finalTotal,
                            originalTotal: getCartTotal(),
                            discount: appliedDiscount,
                            promoCode: appliedDiscount ? orderForm.promoCode : null,
                            deliveryCity: orderForm.deliveryCity,
                            paymentMethod: 'Kartla',
                            bulkPayload
                        }
                    } 
                });
                return;
            }

            // For Cash on Delivery, create all orders in a single bulk request
            await api.post(`/user/${user.id}/orders/bulk`, bulkPayload);

            alert('Sifarişləriniz uğurla qəbul edildi!');
            clearCart();
            navigate('/orders');
        } catch (error) {
            console.error('Checkout error:', error);
            alert('Sifariş zamanı xəta baş verdi.');
        } finally {
            setIsOrderingAction(false);
            setIsOrderModalOpen(false);
        }
    };

    if (cartItems.length === 0) {
        return (
            <div className="container" style={{ padding: '5rem 20px', textAlign: 'center' }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <ShoppingCart size={80} style={{ margin: '0 auto 1.5rem', opacity: 0.2 }} />
                    <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>Səbətiniz boşdur</h2>
                    <p style={{ color: 'var(--text-light)', marginBottom: '2rem' }}>Alış-verişə davam edərək bura məhsullar əlavə edə bilərsiniz.</p>
                    <button className="btn-primary" onClick={() => navigate('/')} style={{ padding: '12px 30px' }}>Alış-verişə davam et</button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '3rem 20px', maxWidth: '1000px' }}>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '15px' , fontFamily: '"Playfair Display", sans-serif'  }}>
                <ShoppingCart size={32} color="var(--primary)" />
                Səbətim
            </h1>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
                {/* Items List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {cartItems.map((item) => (
                        <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass"
                            style={{ padding: '1.25rem', borderRadius: '20px', display: 'flex', gap: '1.5rem', alignItems: 'center' }}
                        >
                            <img 
                                src={item.imageUrls?.[0] || 'https://via.placeholder.com/100'} 
                                alt={item.title} 
                                style={{ width: '100px', height: '100px', borderRadius: '12px', objectFit: 'cover' }} 
                            />
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>{item.title}</h3>
                                <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: '8px' }}>{item.category}</p>
                                <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem' }}>{item.price} ₼</div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem' }}>
                                <div className="quantity-selector" style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.05)', borderRadius: '10px', padding: '2px' }}>
                                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ padding: '6px', background: 'none', border: 'none', cursor: 'pointer' }}><Minus size={16} /></button>
                                    <span style={{ width: '30px', textAlign: 'center', fontWeight: 700 }}>{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ padding: '6px', background: 'none', border: 'none', cursor: 'pointer' }}><Plus size={16} /></button>
                                </div>
                                <button onClick={() => removeFromCart(item.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', fontWeight: 600 }}>
                                    <Trash2 size={16} /> Sil
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Summary Card */}
                <div style={{ position: 'sticky', top: '100px', height: 'fit-content' }}>
                    <div className="glass" style={{ padding: '2rem', borderRadius: '24px' }}>
                        <h3 style={{ marginBottom: '1.5rem', fontWeight: 800 }}>Sifariş Xülasəsi</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-light)' }}>
                                <span>Məhsul sayı:</span>
                                <span>{cartItems.length} ədəd</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-light)' }}>
                                <span>Cəmi miqdar:</span>
                                <span>{cartItems.reduce((acc, item) => acc + item.quantity, 0)} ədəd</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                                <span>Cəmi:</span>
                                <span>{getCartTotal().toFixed(2)} ₼</span>
                            </div>
                        </div>
                        <button 
                            className="btn-primary" 
                            style={{ width: '100%', padding: '16px', borderRadius: '16px', fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                            onClick={handleCheckout}
                        >
                            <span>Sifarişi Tamamla</span>
                            <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Checkout Modal */}
            <AnimatePresence>
                {isOrderModalOpen && (
                    <div className="modal-overlay" onClick={() => setIsOrderModalOpen(false)} style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                    }}>
                        <motion.div 
                            className="modal-content glass" 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{ width: '100%', maxWidth: '500px', borderRadius: '24px', padding: '2rem', background: 'white' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Sifarişi Təsdiqlə</h3>
                                <button onClick={() => setIsOrderModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                    <Plus size={24} style={{ transform: 'rotate(45deg)' }} />
                                </button>
                            </div>
                            
                            <form onSubmit={handleOrderSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
                                <div className="form-group">
                                    <label style={{ fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>Çatdırılma Şəhəri</label>
                                    <select 
                                        value={orderForm.deliveryCity} 
                                        onChange={(e) => setOrderForm(prev => ({ ...prev, deliveryCity: e.target.value }))}
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)' }}
                                    >
                                        <option value="Bakı">Bakı</option>
                                        <option value="Sumqayıt">Sumqayıt</option>
                                        <option value="Gəncə">Gəncə</option>
                                        <option value="Digər">Digər</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label style={{ fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>Promo Kod (Opsional)</label>
                                    <div style={{ display: 'flex', gap: '0.5rem', position: 'relative' }}>
                                        <div style={{ flex: 1, position: 'relative' }}>
                                            <input
                                                type="text"
                                                value={orderForm.promoCode}
                                                onChange={handleSellerInputChange}
                                                placeholder={orderForm.selectedSeller ? `${orderForm.selectedSeller.username} üçün kod yazın` : 'Satıcı adı və ya kod yazın'}
                                                disabled={!!appliedDiscount}
                                                style={{ 
                                                    width: '100%',
                                                    padding: '12px', 
                                                    borderRadius: '12px', 
                                                    border: '1px solid var(--border)',
                                                    textTransform: 'uppercase'
                                                }}
                                            />
                                            {showSellerDropdown && sellerSearchResults.length > 0 && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '100%',
                                                    left: 0,
                                                    right: 0,
                                                    background: 'white',
                                                    border: '1px solid var(--border)',
                                                    borderTop: 'none',
                                                    borderRadius: '0 0 12px 12px',
                                                    maxHeight: '200px',
                                                    overflowY: 'auto',
                                                    zIndex: 10,
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                                }}>
                                                    {sellerSearchResults.map((seller) => (
                                                        <div
                                                            key={seller.id}
                                                            onClick={() => handleSellerSelect(seller)}
                                                            style={{
                                                                padding: '12px',
                                                                borderBottom: '1px solid var(--border)',
                                                                cursor: 'pointer',
                                                                background: orderForm.selectedSeller?.id === seller.id ? 'rgba(18,119,73,0.1)' : 'white',
                                                                transition: 'background 0.2s'
                                                            }}
                                                            onMouseEnter={(e) => e.target.style.background = 'rgba(18,119,73,0.05)'}
                                                            onMouseLeave={(e) => e.target.style.background = orderForm.selectedSeller?.id === seller.id ? 'rgba(18,119,73,0.1)' : 'white'}
                                                        >
                                                            <div style={{ fontWeight: 600 }}>{seller.username}</div>
                                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>ID: {seller.id.substring(0, 8)}...</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {appliedDiscount ? (
                                            <button
                                                type="button"
                                                onClick={removePromoCode}
                                                style={{
                                                    padding: '12px 16px',
                                                    borderRadius: '12px',
                                                    border: 'none',
                                                    background: '#fee2e2',
                                                    color: '#dc2626',
                                                    cursor: 'pointer',
                                                    fontWeight: 600,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px'
                                                }}
                                            >
                                                <X size={16} /> Sil
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={applyPromoCode}
                                                disabled={isValidatingPromo || !orderForm.selectedSeller}
                                                style={{
                                                    padding: '12px 16px',
                                                    borderRadius: '12px',
                                                    border: 'none',
                                                    background: orderForm.selectedSeller ? 'var(--primary)' : '#ccc',
                                                    color: 'white',
                                                    cursor: orderForm.selectedSeller ? 'pointer' : 'not-allowed',
                                                    fontWeight: 600,
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                {isValidatingPromo ? 'Yoxlanılır...' : 'Tətbiq Et'}
                                            </button>
                                        )}
                                    </div>
                                    {promoError && (
                                        <div style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.5rem' }}>{promoError}</div>
                                    )}
                                    {orderForm.selectedSeller && !appliedDiscount && (
                                        <div style={{ color: 'var(--primary)', fontSize: '0.85rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Check size={16} /> Satıcı seçildi: {orderForm.selectedSeller.username}
                                        </div>
                                    )}
                                    {appliedDiscount && (
                                        <div style={{ color: '#16a34a', fontSize: '0.85rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Check size={16} /> Promo kod tətbiq edildi!
                                        </div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label style={{ fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>Ödəniş Üsulu</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <button 
                                            type="button"
                                            onClick={() => setOrderForm(prev => ({ ...prev, paymentMethod: 'Kartla' }))}
                                            style={{
                                                padding: '15px', borderRadius: '16px', border: `2px solid ${orderForm.paymentMethod === 'Kartla' ? 'var(--primary)' : 'var(--border)'}`,
                                                background: orderForm.paymentMethod === 'Kartla' ? 'rgba(18,119,73,0.05)' : 'white',
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer'
                                            }}
                                        >
                                            <CreditCard size={20} color={orderForm.paymentMethod === 'Kartla' ? 'var(--primary)' : 'currentColor'} />
                                            <span style={{ fontWeight: 600 }}>Kartla</span>
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setOrderForm(prev => ({ ...prev, paymentMethod: 'Nağd' }))}
                                            style={{
                                                padding: '15px', borderRadius: '16px', border: `2px solid ${orderForm.paymentMethod === 'Nağd' ? 'var(--primary)' : 'var(--border)'}`,
                                                background: orderForm.paymentMethod === 'Nağd' ? 'rgba(18,119,73,0.05)' : 'white',
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer'
                                            }}
                                        >
                                            <Package size={20} color={orderForm.paymentMethod === 'Nağd' ? 'var(--primary)' : 'currentColor'} />
                                            <span style={{ fontWeight: 600 }}>Nağd</span>
                                        </button>
                                    </div>
                                </div>

                                <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '14px', border: '1px dashed var(--border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>
                                        <span>Yekun Məbləğ:</span>
                                        <span>{calculateTotal().toFixed(2)} ₼</span>
                                    </div>
                                    {appliedDiscount && (
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
                                            Endirim: {appliedDiscount.type === 'PERCENTAGE' ? `${appliedDiscount.value}%` : `${appliedDiscount.value} ₼`}
                                        </div>
                                    )}
                                </div>

                                <button type="submit" className="btn-primary" disabled={isOrderingAction} style={{ padding: '16px', borderRadius: '14px', fontWeight: 800 }}>
                                    {isOrderingAction ? 'Gözləyin...' : 'Sifarişi Tamamla'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CartPage;
