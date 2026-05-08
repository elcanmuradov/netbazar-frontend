import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const extractRoleText = (user) => {
    if (!user) return '';

    if (Array.isArray(user.role)) {
        return user.role.map((r) => String(r)).join(',');
    }

    if (Array.isArray(user.roles)) {
        return user.roles.map((r) => String(r)).join(',');
    }

    if (Array.isArray(user.authorities)) {
        return user.authorities.map((r) => String(r)).join(',');
    }

    return String(user.role || user.roles || user.authorities || user.userRole || '');
};

const AdminRoute = () => {
    const { user, loading, token } = useContext(AuthContext);

    if (loading || (token && !user)) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                backgroundColor: 'var(--bg)'
            }}>
                <div className="spinner"></div>
            </div>
        );
    }

    const roleText = extractRoleText(user).toUpperCase();
    const isAdmin = roleText.includes('ADMIN');

    if (!isAdmin) {
        return <Navigate to="/admin/login" replace />;
    }

    return <Outlet />;
};

export default AdminRoute;
