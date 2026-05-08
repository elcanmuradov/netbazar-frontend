import React, { createContext, useState, useEffect } from 'react';
import api from '../api/axios';

export const AuthContext = createContext();

const jwtDecode = (token) => {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(base64));
};



const isProtectedRoute = (path) => {
    const protectedPrefixes = ['/profile', '/favorites', '/chat', '/add-product', '/edit-product', '/admin', '/seller/dashboard', '/orders'];
    return protectedPrefixes.some(prefix => path.startsWith(prefix));
};

const getLoginPathForCurrentRoute = () => {
    if (window.location.pathname.startsWith('/admin')) {
        return '/admin/login';
    }

    if (window.location.pathname.startsWith('/seller')) {
        return '/seller/login';
    }

    return '/login';
};

const redirectToLogin = (path = '/login') => {
    if (window.location.pathname !== path && isProtectedRoute(window.location.pathname)) {
        window.location.replace(path);
    }
};

const extractRoleText = (decoded) => {
    if (!decoded) return '';

    if (Array.isArray(decoded.role)) {
        return decoded.role.map((r) => String(r)).join(',');
    }

    if (Array.isArray(decoded.roles)) {
        return decoded.roles.map((r) => String(r)).join(',');
    }

    return String(decoded.role || decoded.roles || decoded.authorities || decoded.userRole || '');
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const validateToken = async () => {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const decoded = jwtDecode(token);
                
                // Check if token is expired
                const currentTime = Date.now() / 1000;
                if (decoded.exp < currentTime) {
                    logout();
                    redirectToLogin();
                    return;
                }

                const userData = {
                    ...decoded,
                    id: decoded.userId || decoded.id || decoded.sub // prefer userId from JWT
                };

                const roleText = extractRoleText(decoded).toUpperCase();
                const isAdminToken = roleText.includes('ADMIN');
                const isSellerToken = roleText.includes('SELLER');
                // Keep validation lightweight; dashboard will fetch /admin/stats itself.
                const validationUrl = isAdminToken ? '/admin/user-count' : (isSellerToken ? `/seller/profile/${userData.id}` : '/profile');

                // Use shared axios instance so validation respects VITE_API_BASE_URL (/api in prod).
                await api.get(validationUrl, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                setUser(userData);
            } catch (error) {
                console.error("Token validation error:", error);
                const status = error?.response?.status;
                if (status === 401 || status === 403) {
                    console.warn("Session expired or unauthorized. Logging out.");
                    logout();
                    redirectToLogin(getLoginPathForCurrentRoute());
                    return;
                }
                if (error.message?.includes('token') || error.message?.includes('decode')) {
                    logout();
                    redirectToLogin(getLoginPathForCurrentRoute());
                }
            }
            setLoading(false);
        };

        validateToken();
    }, [token]);

    useEffect(() => {
        if (!token || !user?.id) {
            return undefined;
        }

        let isActive = true;

        const sendPresence = async (path) => {
            try {
                await fetch(path, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'X-User-Id': user.id,
                    },
                    keepalive: true,
                });
            } catch (error) {
                if (isActive) {
                    console.warn('Presence update failed:', error);
                }
            }
        };

        sendPresence('/api/chat/presence/ping');
        const intervalId = window.setInterval(() => {
            sendPresence('/api/chat/presence/ping');
        }, 25000);

        return () => {
            isActive = false;
            window.clearInterval(intervalId);
            sendPresence('/api/chat/presence/offline');
        };
    }, [token, user?.id]);

    const login = (jwtToken) => {
        localStorage.setItem('token', jwtToken);
        setToken(jwtToken);
        try {
            const decoded = jwtDecode(jwtToken);
            const roleText = extractRoleText(decoded).toUpperCase();
            setUser({
                ...decoded,
                id: decoded.userId || decoded.id || decoded.sub
            });
        } catch (error) {
            console.error("Error decoding token on login:", error);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
