import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import LoadingSpinner from './components/common/LoadingSpinner';
// import NotificationToast from './components/common/NotificationToast';
import ErrorBoundary from './components/common/ErrorBoundary';
import { AccessibilityProvider } from './components/common/AccessibilityProvider';

// Import des composants lazy
import Layout from './components/Layout/Layout';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import AuthCallback from './pages/Auth/AuthCallback';
import {
  LazyHomePage,
  LazyFeedPage,
  LazyAlertsPage,
  LazyEventsPage,
  LazyLivestreamsPage,
  LazyHelpPage,
  LazyMapPage,
  LazyMessagesPage,
  LazyFriendsPage,
  LazyProfilePage,
  LazyModerationPage
} from './components/common/LazyLoader';

// Import des actions Redux
import { checkAuthStatus } from './store/slices/authSlice';



// Composant de route protégée
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);

  if (loading) {
    return <LoadingSpinner fullScreen message="Vérification de l'authentification..." />;
  }

  // En mode développement, permettre l'accès même sans authentification
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (!isAuthenticated && !isDevelopment) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);

  useEffect(() => {
    // Vérifier le statut d'authentification au chargement de l'app
    dispatch(checkAuthStatus());
  }, [dispatch]);

  if (loading) {
    return <LoadingSpinner fullScreen message="Chargement de l'application..." />;
  }

  return (
    <ErrorBoundary>
      <AccessibilityProvider>
    <Routes>
      {/* Routes publiques */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      
      {/* Routes protégées avec layout */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
            <Route index element={<LazyHomePage />} />
            <Route path="feed" element={<LazyFeedPage />} />
            <Route path="alerts" element={<LazyAlertsPage />} />
            <Route path="events" element={<LazyEventsPage />} />
            <Route path="livestreams" element={<LazyLivestreamsPage />} />
            <Route path="help" element={<LazyHelpPage />} />
            <Route path="map" element={<LazyMapPage />} />
            <Route path="messages" element={<LazyMessagesPage />} />
            <Route path="friends" element={<LazyFriendsPage />} />
            <Route path="profile" element={<LazyProfilePage />} />
        <Route path="moderation" element={
          <ProtectedRoute allowedRoles={['moderator', 'admin']}>
                <LazyModerationPage />
          </ProtectedRoute>
        } />
      </Route>

      {/* Route par défaut */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
      </AccessibilityProvider>
    </ErrorBoundary>
  );
}

export default App; 