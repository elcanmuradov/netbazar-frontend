import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, ShoppingBag, ShieldAlert, LogOut, ShieldCheck,
    Users, MessageSquare, Store, ShoppingCart, Tag,
    ChevronDown, ChevronRight, DollarSign, Zap, Image
} from 'lucide-react';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import './AdminSidebar.css';

const NavGroup = ({ label, icon: Icon, children }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="nav-group">
            <button className="nav-group-toggle" onClick={() => setOpen(o => !o)}>
                <Icon size={18} />
                <span>{label}</span>
                {open ? <ChevronDown size={14} style={{ marginLeft: 'auto' }} /> : <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
            </button>
            {open && <div className="nav-group-items">{children}</div>}
        </div>
    );
};

const AdminSidebar = () => {
    const { logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const handleLogout = () => { logout(); navigate('/'); };
    const link = (to, Icon, label) => (
        <NavLink to={to} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <Icon size={18} /><span>{label}</span>
        </NavLink>
    );

    return (
        <aside className="admin-sidebar glass">
            <div className="admin-logo">
                <ShieldCheck size={30} color="var(--accent)" />
                <span>Admin Panel</span>
            </div>
            <nav className="admin-nav">
                {link('/admin', LayoutDashboard, 'Dashboard')}

                <NavGroup label="Satıcılar" icon={Store}>
                    {link('/admin/sellers', Store, 'Satıcı İdarəetmə')}
                    {link('/admin/payouts', DollarSign, 'Ödəniş Tarixçəsi')}
                </NavGroup>
                <NavGroup label="Marketinq" icon={Zap}>
                    {link('/admin/discounts', Tag, 'Endirimlər')}
                    {link('/admin/campaigns', Zap, 'Kampaniyalar')}
                    {link('/admin/banners', Image, 'Bannerlər')}
                </NavGroup>
                
                {link('/admin/products', ShoppingBag, 'Məhsul Moderasiyası')}
                {link('/admin/orders', ShoppingCart, 'Sifarişlər')}
                {link('/admin/users', Users, 'İstifadəçilər')}
                {link('/admin/messages', ShieldAlert, 'Şikayətlər')}
                {link('/admin/tickets', MessageSquare, 'Dəstək Biletləri')}
            </nav>
            <div className="admin-footer">
                <button onClick={handleLogout} className="logout-btn">
                    <LogOut size={18} /><span>Çıxış</span>
                </button>
            </div>
        </aside>
    );
};

export default AdminSidebar;
