import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { Smartphone, Play } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

const Footer = () => {
    const { user } = useContext(AuthContext);
    const roleText = String(user?.userRole || user?.role || user?.roles || user?.authorities || '').toUpperCase();
    const isMarketAccount = roleText.includes('MARKET') || roleText.includes('SELLER') || roleText.includes('ADMIN');

    return (
        <footer style={{ background: '#0f2018', color: 'rgba(255,255,255,.75)', marginTop: '4rem', fontFamily: "'Noto Sans', 'Segoe UI', 'Arial', sans-serif" }}>
            <div className="container" style={{ paddingTop: '3.2rem', paddingBottom: '2rem' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1.5fr 1fr 1fr 1fr',
                    gap: '2rem',
                    marginBottom: '3rem'
                }}>
                    <div>
                        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#fff', fontFamily: 'Outfit, sans-serif', fontSize: '1.7rem', fontWeight: 800, marginBottom: '14px' }}>
                            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: 'linear-gradient(135deg, rgb(73 56 20), rgb(207 168 83))', display: 'inline-block' }} />
                            Netbazar
                        </Link>
                        <p style={{ fontSize: '13.5px', lineHeight: 1.7, color: 'rgba(255,255,255,.58)', marginBottom: '18px' }}>
                            Azərbaycanın güvənli marketplace platforması. Minlərlə satıcı, rahat sifariş izləmə və sürətli çatdırılma.
                        </p>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                            <a className="app-btn" href="#" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.16)', color: '#fff', fontSize: '12px', fontWeight: 600, padding: '8px 14px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                <Smartphone size={14} /> App Store
                            </a>
                            <a className="app-btn" href="#" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.16)', color: '#fff', fontSize: '12px', fontWeight: 600, padding: '8px 14px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                <Play size={14} /> Google Play
                            </a>
                        </div>
                        {!isMarketAccount && (
                            <a href="/seller/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: 'rgb(207 168 83)' }}>
                                Satıcı hesabı açın
                            </a>
                        )}
                    </div>

                    <div>
                        <h4 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>Şirkət</h4>
                        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                            <li style={{ marginBottom: '9px' }}><a href="#" style={{ fontSize: '13px', color: 'rgba(255,255,255,.62)' }}>Haqqımızda</a></li>
                            <li style={{ marginBottom: '9px' }}><a href="#" style={{ fontSize: '13px', color: 'rgba(255,255,255,.62)' }}>Karyera</a></li>
                            <li style={{ marginBottom: '9px' }}><a href="#" style={{ fontSize: '13px', color: 'rgba(255,255,255,.62)' }}>Mətbuat</a></li>
                            <li style={{ marginBottom: '9px' }}><a href="#" style={{ fontSize: '13px', color: 'rgba(255,255,255,.62)' }}>Tərəfdaşlıq</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>Müştəri xidməti</h4>
                        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                            <li style={{ marginBottom: '9px' }}><a href="#" style={{ fontSize: '13px', color: 'rgba(255,255,255,.62)' }}>Yardım mərkəzi</a></li>
                            <li style={{ marginBottom: '9px' }}><a href="#" style={{ fontSize: '13px', color: 'rgba(255,255,255,.62)' }}>Sifariş izləmə</a></li>
                            <li style={{ marginBottom: '9px' }}><a href="#" style={{ fontSize: '13px', color: 'rgba(255,255,255,.62)' }}>Qaytarma siyasəti</a></li>
                            <li style={{ marginBottom: '9px' }}><a href="#" style={{ fontSize: '13px', color: 'rgba(255,255,255,.62)' }}>Ödəniş seçimləri</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>Satıcılar</h4>
                        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                            {!isMarketAccount && <li style={{ marginBottom: '9px' }}><a href="/seller/register" style={{ fontSize: '13px', color: 'rgba(255,255,255,.62)' }}>Satıcı ol</a></li>}
                            <li style={{ marginBottom: '9px' }}><a href="/seller/dashboard" style={{ fontSize: '13px', color: 'rgba(255,255,255,.62)' }}>Satıcı paneli</a></li>
                            <li style={{ marginBottom: '9px' }}><a href="#" style={{ fontSize: '13px', color: 'rgba(255,255,255,.62)' }}>Reklam imkanları</a></li>
                            <li style={{ marginBottom: '9px' }}><a href="#" style={{ fontSize: '13px', color: 'rgba(255,255,255,.62)' }}>Komissiya qaydaları</a></li>
                        </ul>
                    </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: '1.2rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', fontSize: '12.5px', color: 'rgba(255,255,255,.4)' }}>
                    <span>© {new Date().getFullYear()} Netbazar MMC. Bütün hüquqlar qorunur.</span>
                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                        <a href="#" style={{ color: 'rgba(255,255,255,.45)' }}>Gizlilik siyasəti</a>
                        <a href="#" style={{ color: 'rgba(255,255,255,.45)' }}>İstifadə şərtləri</a>
                        <a href="#" style={{ color: 'rgba(255,255,255,.45)' }}>Çərəz siyasəti</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
