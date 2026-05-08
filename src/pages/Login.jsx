import React, { useState, useContext } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, Eye, EyeOff } from 'lucide-react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const isSellerLogin = location.pathname.startsWith('/seller') || location.pathname.startsWith('/market');

    const handleChange = (e) => {
        setCredentials(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const endpoint = isSellerLogin ? '/seller/auth/login' : '/auth/login';
            const response = await api.post(endpoint, credentials);

            // Swaply API usually wraps in success response
            if (response.data && response.data.data && response.data.data.token) {
                const token = response.data.data.token;
                const decoded = JSON.parse(atob(token.split('.')[1]));
                const roleText = String(decoded.role || decoded.roles || decoded.authorities || '').toUpperCase();
                const isSeller = roleText.includes('SELLER');
                
                login(token);
                
                if (isSeller) {
                    navigate('/seller/dashboard');
                } else if (roleText.includes('ADMIN')) {
                    navigate('/admin');
                } else {
                    navigate('/');
                }
            } else {
                throw new Error("Token alınmadı");
            }
        } catch (err) {
            console.error("Login xətası:", err);
            if (err.response?.data?.message === "User Banned") {
                setError("İstifadəçinin girişinə müvəqqəti qadağa qoyulub");
            } else {
                setError("E-poçt və ya şifrə yanlışdır.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ padding: '4rem var(--container-padding)', display: 'flex', justifyContent: 'center' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass"
                style={{ padding: '3rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', width: '100%', maxWidth: '450px' }}
            >
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>{isSellerLogin ? 'Satıcı panelinə giriş' : 'Xoş gəlmisiniz'}</h1>
                    <p style={{ color: 'var(--text-light)' }}>{isSellerLogin ? 'Satıcı hesabı ilə daxil olun' : 'Netbazar hesabınıza daxil olun'}</p>
                </div>

                {error && (
                    <div style={{ padding: '10px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label style={labelStyle}><Mail size={16} /> E-poçt</label>
                        <input
                            type="email"
                            name="email"
                            required
                            placeholder={isSellerLogin ? 'satıcı hesab e-poçtu' : 'mail@example.com'}
                            value={credentials.email}
                            onChange={handleChange}
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}><Lock size={16} /> Şifrə</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                required
                                autoComplete="current-password"
                                placeholder="••••••••"
                                value={credentials.password}
                                onChange={handleChange}
                                style={{ ...inputStyle, paddingRight: '44px' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                onMouseDown={(e) => e.preventDefault()}
                                aria-label={showPassword ? 'Şifrəni gizlət' : 'Şifrəni göstər'}
                                style={passwordToggleStyle}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary" style={{ justifyContent: 'center', width: '100%', padding: '14px', marginTop: '1rem', opacity: loading ? 0.7 : 1 }}>
                        <LogIn size={20} /> {loading ? "Daxil olunur..." : "Daxil ol"}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-light)' }}>
                    {isSellerLogin ? 'Bu giriş yalnız satıcı hesabları üçün nəzərdə tutulub.' : <>Hələ hesabınız yoxdur? <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Qeydiyyatdan keçin</Link></>}
                </div>
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
    backgroundColor: '#f9f9f9',
    outline: 'none',
    transition: 'var(--transition)'
};

const passwordToggleStyle = {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'transparent',
    border: 'none',
    color: 'var(--text-light)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    width: '30px',
    height: '30px',
    zIndex: 2
};

export default Login;
