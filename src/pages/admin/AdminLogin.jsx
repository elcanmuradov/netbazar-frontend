import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, User, ArrowRight, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import './AdminLogin.css';

const AdminLogin = () => {
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { login, user } = useContext(AuthContext);
    const navigate = useNavigate();

    // Ensure we are at the top
    React.useLayoutEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Redirect if already logged in as admin
    React.useEffect(() => {
        const roleText = String(user?.role || user?.roles || user?.authorities || user?.userRole || '');
        if (user && roleText.includes('ADMIN')) {
            navigate('/admin', { replace: true });
        }
    }, [user, navigate]);

    const handleChange = (e) => {
        setCredentials(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await api.post('/admin/auth/login', credentials);
            const data = response.data.data;
            
            if (data && data.token) {
                const parts = data.token.split('.');
                if (parts.length === 3) {
                    const payload = JSON.parse(atob(parts[1]));
                    const role = payload.role || payload.roles || payload.authorities || payload.userRole || '';
                    
                    if (String(role).includes('ADMIN')) {
                        login(data.token);
                        navigate('/admin', { replace: true });
                    } else {
                        setError("Bu hesab üçün admin icazəsi yoxdur.");
                    }
                }
            }
        } catch (err) {
            console.error("Login xətası:", err);
            setError("Məlumatlar yanlışdır və ya giriş icazəsi yoxdur.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-wrapper">
            <div className="admin-blobs">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
                <div className="blob blob-3"></div>
            </div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="admin-login-card glass"
            >
                <div className="admin-badge">
                    <Shield size={32} />
                </div>
                
                <div className="admin-header">
                    <h1>Netbazar <span className="dot">Admin</span></h1>
                    <p>İdarəetmə panelinə təhlükəsiz giriş</p>
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="admin-error"
                        >
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label><User size={16} /> E-poçt</label>
                        <input
                            type="email"
                            name="email"
                            required
                            placeholder="admin@netbazar.me"
                            value={credentials.email}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="input-group">
                        <label><Lock size={16} /> Şifrə</label>
                        <div className="password-field">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                required
                                autoComplete="current-password"
                                placeholder="••••••••"
                                value={credentials.password}
                                onChange={handleChange}
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword((prev) => !prev)}
                                onMouseDown={(e) => e.preventDefault()}
                                aria-label={showPassword ? 'Şifrəni gizlət' : 'Şifrəni göstər'}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="admin-btn">
                        {loading ? (
                            <Loader2 className="spinner" size={20} />
                        ) : (
                            <>
                                Daxil ol
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div className="admin-footer-text">
                    Bu səhifə yalnız səlahiyyətli admin istifadəçilər üçündür.
                </div>
            </motion.div>
        </div>
    );
};

export default AdminLogin;
