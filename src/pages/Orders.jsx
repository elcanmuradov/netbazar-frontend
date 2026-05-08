import React, { useContext, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PackageCheck, ClipboardList, Truck, CheckCircle2, CreditCard, Inbox } from 'lucide-react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';

const orderSteps = [
    { id: 'RECEIVED', label: 'Market sifarişi təhvil aldı', icon: ClipboardList },
    { id: 'PREPARING', label: 'Məhsul hazırlanır', icon: PackageCheck },
    { id: 'SHIPPING', label: 'Yoldadır', icon: Truck },
    { id: 'DELIVERED', label: 'Çatdırılıb', icon: CheckCircle2 }
];

const Orders = () => {
    const { user } = useContext(AuthContext);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            if (!user?.id) return;

            setLoading(true);
            try {
                const response = await api.get(`/user/${user.id}/orders`);
                setOrders(response?.data?.data || []);
            } catch (error) {
                console.error('Sifarişlər yüklənərkən xəta baş verdi:', error);
                setOrders([]);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [user?.id]);

    const statusIndex = (status) => orderSteps.findIndex((step) => step.id === String(status || '').toUpperCase());

    return (
        <div className="container" style={{ padding: '3rem 20px', maxWidth: '1100px' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text)' }}>Sifarişlərim</h1>
                <p style={{ color: 'var(--text-light)' }}>Sifariş statusunu marketdən gələn yeniləmələrlə izləyin.</p>
            </div>

            {loading ? (
                <div className="glass" style={{ padding: '2rem', borderRadius: '18px', textAlign: 'center' }}>Yüklənir...</div>
            ) : orders.length === 0 ? (
                <div className="glass" style={{ padding: '3rem 2rem', borderRadius: '18px', textAlign: 'center' }}>
                    <Inbox size={48} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
                    <h3 style={{ marginBottom: '0.5rem' }}>Hazırda sifariş yoxdur</h3>
                    <p style={{ color: 'var(--text-light)' }}>Yeni sifarişlər buraya düşəcək və statuslar burada görünəcək.</p>
                </div>
            ) : (
                <div className="grid" style={{ gap: '1rem' }}>
                    {orders.map((order) => {
                        const currentIndex = statusIndex(order.status);
                        return (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass"
                                style={{ padding: '1.25rem', borderRadius: '18px' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                                    <div>
                                        <h3 style={{ marginBottom: '0.25rem' }}>{order.productTitle}</h3>
                                        <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>Sifariş nömrəsi: {order.id} | Say: {order.quantity || 1}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 800, color: 'var(--primary)' }}>{order.totalPrice} ₼</div>
                                        <div style={{ color: 'var(--text-light)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                            <CreditCard size={16} /> {order.paymentMethod}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '0.75rem' }}>
                                    {orderSteps.map((step, index) => {
                                        const Icon = step.icon;
                                        const active = index <= currentIndex;
                                        return (
                                            <div key={step.id} style={{ padding: '0.9rem', borderRadius: '14px', background: active ? 'rgba(18,119,73,0.08)' : 'rgba(0,0,0,0.03)', border: '1px solid var(--border)' }}>
                                                <Icon size={18} color={active ? 'var(--primary)' : 'var(--text-light)'} />
                                                <div style={{ marginTop: '0.5rem', fontWeight: 700, fontSize: '0.9rem' }}>{step.label}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Orders;