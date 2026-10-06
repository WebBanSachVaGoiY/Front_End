import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './components/ui/Toast';
import { ProtectedRoute, AdminRoute, GuestRoute } from './routes/ProtectedRoute';
import { AdminLayout } from './components/layout/AdminLayout';
import { PageSpinner } from './components/ui/Spinner';

// Lazy load pages for better performance
const HomePage = lazy(() => import('./pages/public/HomePage'));
const BooksPage = lazy(() => import('./pages/public/BooksPage'));
const BookDetailPage = lazy(() => import('./pages/public/BookDetailPage'));
const LoginPage = lazy(() => import('./pages/public/LoginPage'));
const RegisterPage = lazy(() => import('./pages/public/RegisterPage'));

const CartPage = lazy(() => import('./pages/user/CartPage'));
const CheckoutPage = lazy(() => import('./pages/user/CheckoutPage'));
const OrderHistoryPage = lazy(() => import('./pages/user/OrderHistoryPage'));
const ProfilePage = lazy(() => import('./pages/user/ProfilePage'));

const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'));
const ManageCategoriesPage = lazy(() => import('./pages/admin/ManageCategoriesPage'));
const ManageBooksPage = lazy(() => import('./pages/admin/ManageBooksPage'));
const ManageOrdersPage = lazy(() => import('./pages/admin/ManageOrdersPage'));
const ManageUsersPage = lazy(() => import('./pages/admin/ManageUsersPage'));

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <Suspense fallback={<PageSpinner />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/books" element={<BooksPage />} />
                <Route path="/books/:id" element={<BookDetailPage />} />

                {/* Guest only routes */}
                <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
                <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

                {/* Protected User Routes */}
                <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
                <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
                <Route path="/orders" element={<ProtectedRoute><OrderHistoryPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

                {/* Admin Routes */}
                <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                  <Route index element={<DashboardPage />} />
                  <Route path="categories" element={<ManageCategoriesPage />} />
                  <Route path="books" element={<ManageBooksPage />} />
                  <Route path="orders" element={<ManageOrdersPage />} />
                  <Route path="users" element={<ManageUsersPage />} />
                </Route>

                {/* Catch all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
