import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://api.netbazar.tech',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
      if (typeof config.headers.delete === 'function') {
        config.headers.delete('Content-Type');
      } else {
        delete config.headers['Content-Type'];
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(

  (response) => response,
  (error) => {
    const requestUrl = error?.config?.url || '';
    const isAuthEndpoint = requestUrl.includes('/auth/login')
      || requestUrl.includes('/auth/register')
      || requestUrl.includes('/auth/send-code')
      || requestUrl.includes('/auth/verify')
      || requestUrl.includes('/admin/auth/login')
      || requestUrl.includes('/admin/auth/register');

    const isProtectedRoute = (path) => {
      const protectedPrefixes = ['/profile', '/favorites', '/chat', '/add-product', '/edit-product', '/admin', '/seller/dashboard', '/orders'];
      return protectedPrefixes.some(prefix => path.startsWith(prefix));
    };

    const getLoginPathForCurrentRoute = (path) => {
      if (path.startsWith('/admin')) {
        return '/admin/login';
      }

      if (path.startsWith('/seller')) {
        return '/seller/login';
      }

      return '/login';
    };

    if (error.response && error.response.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('token');
      
      if (isProtectedRoute(window.location.pathname)) {
        window.location.href = getLoginPathForCurrentRoute(window.location.pathname);
      }
    }
    return Promise.reject(error);
  }
);


export default api;
