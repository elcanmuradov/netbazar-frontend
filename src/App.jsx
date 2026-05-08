import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import Home from './pages/Home';
import AddProduct from './pages/AddProduct';
import ProductDetail from './pages/ProductDetail';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Favorites from './pages/Favorites';
import Login from './pages/Login';
import Register from './pages/Register';
import EditProduct from './pages/EditProduct';
import Support from './pages/Support';
import Orders from './pages/Orders';
import MarketDashboard from './pages/market/MarketDashboard';
import SellerLayout from './pages/market/SellerLayout';
import SellerDashboard from './pages/market/SellerDashboard';
import SellerOrders from './pages/market/SellerOrders';
import SellerProducts from './pages/market/SellerProducts';
import SellerProfile from './pages/market/SellerProfile';
import SellerStore from './pages/SellerStore';
import FakePayment from './pages/FakePayment';
import CartPage from './pages/CartPage';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './components/Toast/ToastContext';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import Dashboard from './pages/admin/Dashboard';
import AdminLayout from './pages/admin/AdminLayout';
import Messages from './pages/admin/Messages';
import Products from './pages/admin/Products';
import Users from './pages/admin/Users';
import Tickets from './pages/admin/Tickets';
import Sellers from './pages/admin/Sellers';
import AdminOrders from './pages/admin/Orders';
import Discounts from './pages/admin/Discounts';
import Campaigns from './pages/admin/Campaigns';
import Payouts from './pages/admin/Payouts';
import AdminRoute from './components/admin/AdminRoute';

const UserLayout = () => (
    <div className="app-wrapper" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <main style={{ flex: 1 }}>
            <Outlet />
        </main>
        <Footer />
    </div>
);

function AppContent() {
    const location = useLocation();
    
    return (
        <Routes key={location.pathname}>
            {/* Admin Auth Route - Explicitly at top */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* User Routes inside UserLayout */}
            <Route element={<UserLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/add-product" element={<AddProduct />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/notifications" element={<Profile />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/login" element={<Login />} />
                <Route path="/seller/login" element={<Login />} />
                <Route path="/seller/register" element={<Register />} />
                <Route path="/market/login" element={<Navigate to="/seller/login" replace />} />
                <Route path="/market/register" element={<Navigate to="/seller/register" replace />} />
                <Route path="/market" element={<Navigate to="/seller/dashboard" replace />} />
                {/* Legacy single-page dashboard kept for backward compat */}
                <Route path="/seller/dashboard-old" element={<MarketDashboard />} />
                <Route path="/register" element={<Register />} />
                <Route path="/edit-product/:productId" element={<EditProduct />} />
                <Route path="/seller-store/:id" element={<SellerStore />} />
                <Route path="/payment" element={<FakePayment />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/support" element={<Support />} />
            </Route>

            {/* Seller Panel Routes - own layout, no Navbar/Footer */}
            <Route element={<SellerLayout />}>
                <Route path="/seller/dashboard" element={<SellerDashboard />} />
                <Route path="/seller/orders"    element={<SellerOrders />} />
                <Route path="/seller/products"  element={<SellerProducts />} />
                <Route path="/seller/profile"   element={<SellerProfile />} />
            </Route>

            {/* Admin Private Routes */}
            <Route element={<AdminRoute />}>
                <Route element={<AdminLayout />}>
                    <Route path="/admin" element={<Dashboard />} />
                    <Route path="/admin/products" element={<Products />} />
                    <Route path="/admin/messages" element={<Messages />} />
                    <Route path="/admin/users" element={<Users />} />
                    <Route path="/admin/tickets" element={<Tickets />} />
                    <Route path="/admin/sellers" element={<Sellers />} />
                    <Route path="/admin/orders" element={<AdminOrders />} />
                    <Route path="/admin/discounts" element={<Discounts />} />
                    <Route path="/admin/campaigns" element={<Campaigns />} />
                    <Route path="/admin/payouts" element={<Payouts />} />
                </Route>
            </Route>
        </Routes>
    );
}

function App() {
    return (
        <AuthProvider>
            <CartProvider>
                <ToastProvider>
                    <Router>
                        <AppContent />
                    </Router>
                </ToastProvider>
            </CartProvider>
        </AuthProvider>
    );
}

export default App;
