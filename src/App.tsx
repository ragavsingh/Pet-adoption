import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './contexts/ToastContext';
import { ConfirmProvider } from './contexts/ConfirmContext';
import { AuthProvider } from './contexts/AuthContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Layouts
import { PublicLayout } from './components/layout/PublicLayout';
import { AdopterLayout } from './components/layout/AdopterLayout';
import { ProviderLayout } from './components/layout/ProviderLayout';
import { AdminLayout } from './components/layout/AdminLayout';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { PetsPage } from './pages/public/PetsPage';
import { PetDetailsPage } from './pages/public/PetDetailsPage';
import { HowItWorksPage } from './pages/public/HowItWorksPage';
import { AboutPage } from './pages/public/AboutPage';
import { ForProvidersPage } from './pages/public/ForProvidersPage';
import { ContactPage } from './pages/public/ContactPage';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { AuthCallbackPage } from './pages/auth/AuthCallbackPage';

// Adopter Pages
import { AdopterDashboard } from './pages/adopter/AdopterDashboard';
import { AdopterProfilePage } from './pages/adopter/AdopterProfilePage';
import { AdopterFavoritesPage } from './pages/adopter/AdopterFavoritesPage';
import { AdopterRequestsPage } from './pages/adopter/AdopterRequestsPage';
import { AdopterRequestDetailsPage } from './pages/adopter/AdopterRequestDetailsPage';
import { AdopterAdoptionsPage } from './pages/adopter/AdopterAdoptionsPage';
import { AdopterNotificationsPage } from './pages/adopter/AdopterNotificationsPage';
import { AdopterSettingsPage } from './pages/adopter/AdopterSettingsPage';

// Provider Pages
import { ProviderDashboard } from './pages/provider/ProviderDashboard';
import { ProviderPetsPage } from './pages/provider/ProviderPetsPage';
import { AddPetPage } from './pages/provider/AddPetPage';
import { EditPetPage } from './pages/provider/EditPetPage';
import { ProviderRequestsPage } from './pages/provider/ProviderRequestsPage';
import { ProviderAdoptionsPage } from './pages/provider/ProviderAdoptionsPage';
import { ProviderProfilePage } from './pages/provider/ProviderProfilePage';
import { ProviderNotificationsPage } from './pages/provider/ProviderNotificationsPage';
import { ProviderSettingsPage } from './pages/provider/ProviderSettingsPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminProvidersPage } from './pages/admin/AdminProvidersPage';
import { AdminPetsPage } from './pages/admin/AdminPetsPage';
import { AdminRequestsPage } from './pages/admin/AdminRequestsPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminTestBenchPage } from './pages/admin/AdminTestBenchPage';

// Success / Certificate Page
import { AdoptionSuccessPage } from './pages/AdoptionSuccessPage';
import { ScrollRestoration } from './components/common/ScrollRestoration';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ScrollRestoration />
      <ConfirmProvider>
        <ToastProvider>
        <AuthProvider>
          <FavoritesProvider>
            <NotificationsProvider>
              <ErrorBoundary>
                <Routes>
                  {/* Public Routes with PublicLayout */}
                  <Route element={<PublicLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/pets" element={<PetsPage />} />
                    <Route path="/pets/:id" element={<PetDetailsPage />} />
                    <Route path="/how-it-works" element={<HowItWorksPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/for-providers" element={<ForProvidersPage />} />
                    <Route path="/contact" element={<ContactPage />} />

                    {/* Auth public routes */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/auth/callback" element={<AuthCallbackPage />} />

                    {/* Adoption Certificate / Success */}
                    <Route path="/adoption-success" element={<AdoptionSuccessPage />} />
                    <Route path="/adoption-success/:id" element={<AdoptionSuccessPage />} />
                  </Route>

                  {/* Adopter Protected Routes */}
                  <Route element={<ProtectedRoute allowedRoles={['adopter']} />}>
                    <Route path="/adopter" element={<AdopterLayout />}>
                      <Route path="dashboard" element={<AdopterDashboard />} />
                      <Route path="profile" element={<AdopterProfilePage />} />
                      <Route path="discover" element={<Navigate to="/pets" replace />} />
                      <Route path="favorites" element={<AdopterFavoritesPage />} />
                      <Route path="requests" element={<AdopterRequestsPage />} />
                      <Route path="requests/:id" element={<AdopterRequestDetailsPage />} />
                      <Route path="adoptions" element={<AdopterAdoptionsPage />} />
                      <Route path="notifications" element={<AdopterNotificationsPage />} />
                      <Route path="settings" element={<AdopterSettingsPage />} />
                      <Route index element={<Navigate to="dashboard" replace />} />
                    </Route>
                  </Route>

                  {/* Provider Protected Routes */}
                  <Route element={<ProtectedRoute allowedRoles={['provider']} />}>
                    <Route path="/provider" element={<ProviderLayout />}>
                      <Route path="dashboard" element={<ProviderDashboard />} />
                      <Route path="pets" element={<ProviderPetsPage />} />
                      <Route path="add-pet" element={<AddPetPage />} />
                      <Route path="edit-pet/:id" element={<EditPetPage />} />
                      <Route path="requests" element={<ProviderRequestsPage />} />
                      <Route path="adoptions" element={<ProviderAdoptionsPage />} />
                      <Route path="profile" element={<ProviderProfilePage />} />
                      <Route path="notifications" element={<ProviderNotificationsPage />} />
                      <Route path="settings" element={<ProviderSettingsPage />} />
                      <Route index element={<Navigate to="dashboard" replace />} />
                    </Route>
                  </Route>

                  {/* Dedicated Standalone Admin Portal (Protected internally by Admin Security Gateway & Master Passkey) */}
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="users" element={<AdminUsersPage />} />
                    <Route path="providers" element={<AdminProvidersPage />} />
                    <Route path="pets" element={<AdminPetsPage />} />
                    <Route path="requests" element={<AdminRequestsPage />} />
                    <Route path="reports" element={<AdminReportsPage />} />
                    <Route path="test-bench" element={<AdminTestBenchPage />} />
                    <Route path="settings" element={<AdminSettingsPage />} />
                    <Route index element={<Navigate to="dashboard" replace />} />
                  </Route>

                  {/* Catch all fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </ErrorBoundary>
            </NotificationsProvider>
          </FavoritesProvider>
        </AuthProvider>
      </ToastProvider>
    </ConfirmProvider>
  </BrowserRouter>
  );
};

export default App;
