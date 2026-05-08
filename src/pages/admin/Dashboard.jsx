import React, { useState, useEffect } from 'react';
import { ShoppingBag, Users, ShieldAlert, TrendingUp, ArrowUpRight, BarChart3, Clock, CheckCircle2, CloudOff, Store } from 'lucide-react';
import api from '../../api/axios';
import './Dashboard.css';

const Dashboard = () => {
    const [stats, setStats] = useState({
        productCount: 0,
        reportedMessagesCount: 0,
        userCount: 0,
        sellerCount: 0,
        activeReports: 0,
        productGrowth: 0,
        userGrowth: 0,
        sellerGrowth: 0
    });
    const [loading, setLoading] = useState(true);
    const [clearingCloud, setClearingCloud] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/admin/stats');
                const data = res.data.data;

                setStats({
                    productCount: data.totalProducts,
                    reportedMessagesCount: data.totalReports,
                    userCount: data.totalUsers,
                    sellerCount: data.totalSellers,
                    activeReports: data.activeReports,
                    productGrowth: data.productGrowth,
                    userGrowth: data.userGrowth,
                    sellerGrowth: data.sellerGrowth
                });
            } catch (error) {
                console.error("Error fetching admin stats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const handleClearCloud = async () => {
        if (!window.confirm("Bütün media faylları buluddan silinəcək. Bu əməliyyat geri qaytarıla bilməz. Davam etmək istəyirsiniz?")) {
            return;
        }

        setClearingCloud(true);
        try {
            await api.delete('/media/delete-all');
            alert("Bütün bulud resursları müvəffəqiyyətlə silindi!");
        } catch (error) {
            console.error("Buludu təmizləyərkən xəta baş verdi", error);
            alert("Buludu təmizləmək mümkün olmadı: " + (error.response?.data?.message || error.message));
        } finally {
            setClearingCloud(false);
        }
    };

    const StatCard = ({ title, value, icon: Icon, color, trend }) => (
        <div className="stat-card glass">
            <div className={`icon-container ${color}`}>
                <Icon size={24} />
            </div>
            <div className="stat-content">
                <p className="stat-title">{title}</p>
                <div className="stat-value-container">
                    <h2 className="stat-value">{value}</h2>
                    {trend && (
                        <span className="stat-trend positive">
                            <TrendingUp size={14} /> {trend}%
                        </span>
                    )}
                </div>
            </div>
            <div className="stat-decoration">
                <BarChart3 size={40} className="icon-bg" />
            </div>
        </div>
    );

    if (loading) return <div className="loading-state">Initializing Dashboard...</div>;

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div>
                    <h1>Xoş gəlmisiniz, admin</h1>
                    <p>Netbazar platformasının fəaliyyəti və moderasiya icmalı</p>
                </div>
                <div className="date-badge">
                    <Clock size={16} />
                    <span>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
            </header>

            <div className="stats-grid">
                <StatCard title="Ümumi məhsul" value={stats.productCount} icon={ShoppingBag} color="green" trend={stats.productGrowth} />
                <StatCard title="Ümumi istifadəçi" value={stats.userCount} icon={Users} color="blue" trend={stats.userGrowth} />
                <StatCard title="Ümumi satıcı" value={stats.sellerCount} icon={Store} color="red"  trend={stats.sellerGrowth}/>
                <StatCard title="Şikayət edilmiş mesajlar" value={stats.reportedMessagesCount} icon={ShieldAlert} color="orange" />
                <StatCard title="Aktiv müraciətlər" value={stats.activeReports} icon={CheckCircle2} color="purple" />
            </div>

            <div className="dashboard-sections">
                <section className="dashboard-side glass">
                    <div className="section-header">
                        <h3>Tez əməliyyatlar</h3>
                    </div>
                    <div className="action-buttons">
                        <button 
                            className={`q-action-btn danger ${clearingCloud ? 'loading' : ''}`}
                            onClick={handleClearCloud}
                            disabled={clearingCloud}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                        >
                            <CloudOff size={18} />
                            {clearingCloud ? 'İcra olunur...' : 'Buludu təmizlə'}
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Dashboard;
