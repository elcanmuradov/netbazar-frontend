import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { PlusCircle, User, Menu, X, LogOut, Heart, ShieldCheck, Home, ShoppingBag, ChevronRight, HelpCircle, ShoppingCart, MessageCircle } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { CartContext } from '../../context/CartContext';
import mainLogo from '../../imgs/mainlogo.png';

const DrawerLink = ({ to, icon: Icon, label, onClick, color = 'inherit' }) => (
    <Link to={to} onClick={onClick} className="drawer-link">
        <div style={{ color }}><Icon size={24} /></div>
        <span style={{ fontWeight: 600 }}>{label}</span>
        <ChevronRight size={18} style={{ marginLeft: 'auto', color: '#ccc' }} />
    </Link>
);

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { user, logout } = useContext(AuthContext);
    const { getCartCount } = useContext(CartContext);
    const cartCount = getCartCount();
    const navigate = useNavigate();
    const location = useLocation();
    const roleText = String(user?.userRole || user?.role || user?.roles || user?.authorities || '').toUpperCase();
    const isMarketAccount = roleText.includes('MARKET') || roleText.includes('SELLER') || roleText.includes('ADMIN');

    // Close menu on route change
    useEffect(() => {
        setIsMenuOpen(false);
    }, [location.pathname]);

    // Prevent scroll when menu is open
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isMenuOpen]);

    return (
        <>
            <nav className="glass" style={{
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                padding: '0.85rem 0',
                borderBottom: '1px solid var(--border)',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)'
            }}>
                <div className="container" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    {!isMarketAccount && (
                        <button
                            type="button"
                            className="seller-cta"
                            onClick={() => {
                                window.location.href = '/seller/register';
                            }}
                        >
                            Satıcı ol
                        </button>
                    )}

                    {/* Logo - Left */}
                    <Link to="/" style={{
                        fontSize: '1.8rem',
                        fontWeight: 800,
                        color: 'var(--primary)',
                        fontFamily: 'Outfit',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0',
                        whiteSpace: 'nowrap'
                    }}>
                        <img
                            src={mainLogo}
                            alt="Loqo"
                            style={{ width: '225px', height: '75px', objectFit: 'contain' }}
                        />
                    </Link>

                    {/* Desktop Icon & Menu Area */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {/* Desktop Icons */}
                        <div className="v-desktop">
                            {user ? (
                                <>
                                    <Link to="/support" className="nav-icon-link" title="Dəstək"><HelpCircle size={21} /></Link>
                                    {!isMarketAccount && <Link to="/favorites" className="nav-icon-link" title="Sevimlilər"><Heart size={21} /></Link>}
                                    {!isMarketAccount && (
                                        <>
                                            <Link to="/orders" className="nav-icon-link" title="Sifarişlər"><ShoppingBag size={21} /></Link>
                                            <Link to="/cart" className="nav-icon-link" title="Səbət" style={{ position: 'relative' }}>
                                                <ShoppingCart size={21} />
                                                {cartCount > 0 && (
                                                    <span style={{ position: 'absolute', top: '0', right: '0', background: 'var(--accent)', color: 'white', borderRadius: '50%', width: '16px', height: '16px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                                                        {cartCount}
                                                    </span>
                                                )}
                                            </Link>
                                        </>
                                    )}
                                    <Link to="/chat" className="nav-icon-link" title="Mesajlar"><MessageCircle size={21} /></Link>
                                    <Link to={isMarketAccount ? "/seller/dashboard" : "/profile"} className="nav-icon-link" title="Hesab"><User size={21} /></Link>
                                    {isMarketAccount && (
                                        <button className="btn-accent" onClick={() => navigate('/seller/dashboard')} style={{ padding: '8px 18px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600, marginLeft: '0.5rem' }}>
                                            <ShoppingBag size={18} />
                                            <span>Satıcı paneli</span>
                                        </button>
                                    )}
                                    {roleText.includes('ADMIN') && (
                                        <Link to="/admin" style={{ color: 'var(--accent)' }} className="nav-icon-link" title="Admin"><ShieldCheck size={21} /></Link>
                                    )}
                                    <button onClick={() => { logout(); navigate('/') }} className="nav-icon-link" title="Çıxış"><LogOut size={21} /></button>
                                    {isMarketAccount && (
                                        <button className="btn-accent" onClick={() => navigate('/add-product')} style={{ padding: '8px 18px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600, marginLeft: '0.5rem' }}>
                                            <PlusCircle size={18} />
                                            <span>Yeni məhsul</span>
                                        </button>
                                    )}
                                </>
                            ) : (
                                <button className="btn-accent" onClick={() => navigate('/login')} style={{ padding: '8px 22px', borderRadius: '12px', fontWeight: 600 }}>
                                    <span>Daxil ol</span>
                                </button>
                            )}
                        </div>

                        {/* Mobile Icons */}
                        <div className="v-mobile">
                            {!isMarketAccount && (
                                <Link to="/favorites" style={{ color: 'var(--text)', padding: '6px' }}>
                                    <Heart size={26} />
                                </Link>
                            )}
                            {!isMarketAccount && (
                                <Link to="/cart" style={{ color: 'var(--text)', padding: '6px', position: 'relative' }}>
                                    <ShoppingCart size={26} />
                                    {cartCount > 0 && (
                                        <span style={{ position: 'absolute', top: '2px', right: '2px', background: 'var(--accent)', color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                                            {cartCount}
                                        </span>
                                    )}
                                </Link>
                            )}
                            <button
                                onClick={() => setIsMenuOpen(true)}
                                style={{
                                    color: 'var(--primary)',
                                    padding: '8px',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                <Menu size={26} />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Side Drawer - Improved Logic to prevent white screen */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 2000,
                display: isMenuOpen ? 'block' : 'none',
                transition: 'none'
            }}>
                {/* Backdrop Layer */}
                <div 
                    onClick={() => setIsMenuOpen(false)}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        opacity: isMenuOpen ? 1 : 0,
                        transition: 'opacity 0.3s ease-out'
                    }} 
                />

                {/* Content Layer (Drawer) */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: '85%',
                    maxWidth: '350px',
                    backgroundColor: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    transform: isMenuOpen ? 'translateX(0)' : 'translateX(100%)',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '-8px 0 30px rgba(0,0,0,0.1)'
                }}>
                    {/* Header */}
                    <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid #eee' }}>
                        <button onClick={() => setIsMenuOpen(false)} style={{ padding: '8px' }}>
                            <X size={28} />
                        </button>
                    </div>

                    {/* User Profile Info */}
                    <div style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
                        {user ? (
                            <>
                                <div style={{ 
                                    width: '64px', 
                                    height: '64px', 
                                    borderRadius: '50%', 
                                    backgroundColor: 'var(--accent)', 
                                    color: 'white', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    margin: '0 auto 1rem',
                                    fontSize: '1.6rem',
                                    fontWeight: 800
                                }}>
                                    {user?.email?.charAt(0).toUpperCase()}
                                </div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Xoş gəldiniz!</h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '4px' }}>{user?.email}</p>
                            </>
                        ) : (
                            <>
                                <img
                                    src={mainLogo}
                                    alt="Loqo"
                                    style={{ width: '72px', height: '72px', objectFit: 'contain', margin: '0 auto 0.75rem' }}
                                />
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', margin: '0.25rem 0 1.5rem' }}>Alış-veriş və satış üçün hesabınıza daxil olun.</p>
                                <button className="btn-accent" onClick={() => navigate('/login')} style={{ width: '100%', padding: '14px', borderRadius: '14px', fontWeight: 700 }}>Daxil ol</button>
                            </>
                        )}
                    </div>

                    {/* Links */}
                    <div style={{ padding: '0 1rem', flex: 1, overflowY: 'auto' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {!isMarketAccount && <DrawerLink to="/" icon={Home} label="Ana səhifə" onClick={() => setIsMenuOpen(false)} />}
                            {!isMarketAccount && <DrawerLink to="/favorites" icon={Heart} label="Sevimlilər" onClick={() => setIsMenuOpen(false)} />}
                            {!isMarketAccount && (
                                <a href="/seller/register" className="drawer-link" style={{ color: 'var(--accent)' }}>
                                    <div><ShoppingBag size={24} /></div>
                                    <span style={{ fontWeight: 600 }}>Satıcı ol</span>
                                    <ChevronRight size={18} style={{ marginLeft: 'auto', color: '#ccc' }} />
                                </a>
                            )}
                            
                            {user && (
                                <>
                                    <div style={{ padding: '1.5rem 1rem 0.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase' }}>Hesab</div>
                                    {!isMarketAccount && <DrawerLink to="/orders" icon={ShoppingBag} label="Sifarişlər" onClick={() => setIsMenuOpen(false)} />}
                                    {!isMarketAccount && <DrawerLink to="/cart" icon={ShoppingCart} label="Səbət" onClick={() => setIsMenuOpen(false)} />}
                                    <DrawerLink to="/chat" icon={MessageCircle} label="Mesajlar" onClick={() => setIsMenuOpen(false)} />
                                    <DrawerLink to={isMarketAccount ? "/seller/dashboard" : "/profile"} icon={User} label="Profil" onClick={() => setIsMenuOpen(false)} />
                                    <DrawerLink to="/support" icon={HelpCircle} label="Dəstək" onClick={() => setIsMenuOpen(false)} />
                                    
                                    <div style={{ padding: '1.5rem 1rem 0.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase' }}>Hərəkətlər</div>
                                    {isMarketAccount && (
                                        <DrawerLink to="/add-product" icon={PlusCircle} label="Yeni məhsul" onClick={() => setIsMenuOpen(false)} color="var(--accent)" />
                                    )}
                                    {isMarketAccount && (
                                        <DrawerLink to="/seller/dashboard" icon={ShoppingBag} label="Satıcı paneli" onClick={() => setIsMenuOpen(false)} color="var(--primary)" />
                                    )}
                                    
                                    {roleText.includes('ADMIN') && (
                                        <DrawerLink to="/admin" icon={ShieldCheck} label="Admin paneli" onClick={() => setIsMenuOpen(false)} color="var(--primary)" />
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Drawer Footer */}
                    <div style={{ padding: '1.5rem', borderTop: '1px solid #eee' }}>
                        {user && (
                            <button onClick={() => { logout(); setIsMenuOpen(false); navigate('/') }} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', color: '#ef4444', fontWeight: 600 }}>
                                <LogOut size={20} />
                                Çıxış et
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .v-desktop { display: flex; align-items: center; gap: 1.2rem; }
                .v-mobile { display: none; align-items: center; gap: 1rem; }

                .seller-cta {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 9px 16px;
                    border-radius: 12px;
                    border: 1px solid rgba(73, 56, 20, 0.25);
                    background: linear-gradient(135deg, rgba(73, 56, 20, 0.1), rgba(175, 134, 47, 0.2));
                    color: var(--primary);
                    font-weight: 700;
                    font-size: 0.88rem;
                    transition: transform 0.15s, opacity 0.2s;
                }
                .seller-cta:hover { opacity: 0.92; transform: translateY(-1px); }
                
                @media (max-width: 768px) {
                    .v-desktop { display: none !important; }
                    .v-mobile { display: flex !important; }
                    .seller-cta {
                        padding: 8px 12px;
                        font-size: 0.8rem;
                    }
                }

                .nav-icon-link {
                    color: var(--text-light);
                    padding: 8px;
                    border-radius: 10px;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                }
                .nav-icon-link:hover { background: rgba(0,0,0,0.05); color: var(--primary); }

                .drawer-link {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem;
                    border-radius: 12px;
                    text-decoration: none;
                    color: var(--text);
                    transition: background 0.2s;
                }
                .drawer-link:active { background: #f0f0f0; }
            `}</style>
        </>
    );
};

export default Navbar;
