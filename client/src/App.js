import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import LoadingSpinner from './components/common/LoadingSpinner';
import NotificationToast from './components/common/NotificationToast';

// Import des composants
import Layout from './components/Layout/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import ProfilePage from './pages/Profile/ProfilePage';
import FeedPage from './pages/Feed/FeedPage';
import AlertsPage from './pages/Alerts/AlertsPage';
import EventsPage from './pages/Events/EventsPage';
import LivestreamsPage from './pages/Livestreams/LivestreamsPage';
import HelpPage from './pages/Help/HelpPage';
import MapPage from './pages/Map/MapPage';
import MessagesPage from './pages/Messages/MessagesPage';
import ModerationPage from './pages/Moderation/ModerationPage';

// Import des actions Redux
import { checkAuthStatus } from './store/slices/authSlice';



// Composant de route protégée
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);

  if (loading) {
    return <LoadingSpinner fullScreen message="Vérification de l'authentification..." />;
  }

  if (!isAuthenticated) {
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
    <Routes>
      {/* Routes publiques */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Routes protégées avec layout */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<HomePage />} />
        <Route path="feed" element={<FeedPage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="livestreams" element={<LivestreamsPage />} />
        <Route path="help" element={<HelpPage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="moderation" element={
          <ProtectedRoute allowedRoles={['moderator', 'admin']}>
            <ModerationPage />
          </ProtectedRoute>
        } />
      </Route>

      {/* Route par défaut */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App; 