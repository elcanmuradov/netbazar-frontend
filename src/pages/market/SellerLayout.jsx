import React, { useContext } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import {
    LayoutDashboard, ShoppingBag, ShoppingCart,
    User, LogOut, Store, MessageCircle
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import './SellerLayout.css';

const SellerLayout = () => {
    const { logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const links = [
        { to: '/seller/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/chat',             icon: MessageCircle,   label: 'Mesajlar' },
        { to: '/seller/orders',    icon: ShoppingCart,    label: 'Sifarişlər' },
        { to: '/seller/products',  icon: ShoppingBag,     label: 'Məhsullarım' },
        { to: '/seller/profile',   icon: User,            label: 'Profil' },
    ];

    return (
        <div className="seller-layout">
            <aside className="seller-sidebar glass">
                <div className="seller-logo">
                    <Store size={28} color="var(--accent)" />
                    <span>Satıcı Panel</span>
                </div>
                <nav className="seller-nav">
                    {links.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === '/seller/dashboard'}
                            className={({ isActive }) =>
                                isActive ? 'seller-nav-item active' : 'seller-nav-item'
                            }
                        >
                            <Icon size={19} />
                            <span>{label}</span>
                        </NavLink>
                    ))}
                </nav>
                <div className="seller-sidebar-footer">
                    <button className="seller-logout" onClick={handleLogout}>
                        <LogOut size={18} />
                        <span>Çıxış</span>
                    </button>
                </div>
            </aside>

            <main className="seller-content">
                <div className="seller-content-inner animate-fade-in">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default SellerLayout;
