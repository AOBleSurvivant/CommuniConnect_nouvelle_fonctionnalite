import React, { Suspense, lazy } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import LoadingSpinner from './LoadingSpinner';

// Composant de fallback pour le lazy loading
const LazyFallback = ({ message = "Chargement..." }) => (
  <Box
    display="flex"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    minHeight="200px"
    p={3}
  >
    <CircularProgress size={40} />
    <Typography variant="body2" color="text.secondary" mt={2}>
      {message}
    </Typography>
  </Box>
);

// Fonction utilitaire pour créer des composants lazy avec fallback personnalisé
export const createLazyComponent = (importFunc, fallbackMessage) => {
  const LazyComponent = lazy(importFunc);
  
  return (props) => (
    <Suspense fallback={<LazyFallback message={fallbackMessage} />}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

// Composants lazy pré-configurés
export const LazyHomePage = createLazyComponent(
  () => import('../../pages/HomePage'),
  "Chargement de la page d'accueil..."
);

export const LazyFeedPage = createLazyComponent(
  () => import('../../pages/Feed/FeedPage'),
  "Chargement du flux..."
);

export const LazyAlertsPage = createLazyComponent(
  () => import('../../pages/Alerts/AlertsPage'),
  "Chargement des alertes..."
);

export const LazyEventsPage = createLazyComponent(
  () => import('../../pages/Events/EventsPage'),
  "Chargement des événements..."
);

export const LazyMapPage = createLazyComponent(
  () => import('../../pages/Map/MapPage'),
  "Chargement de la carte..."
);

export const LazyMessagesPage = createLazyComponent(
  () => import('../../pages/Messages/MessagesPage'),
  "Chargement des messages..."
);

export const LazyProfilePage = createLazyComponent(
  () => import('../../pages/Profile/ProfilePage'),
  "Chargement du profil..."
);

export const LazyFriendsPage = createLazyComponent(
  () => import('../../pages/Friends/FriendsPage'),
  "Chargement des amis..."
);

export const LazyLivestreamsPage = createLazyComponent(
  () => import('../../pages/Livestreams/LivestreamsPage'),
  "Chargement des livestreams..."
);

export const LazyHelpPage = createLazyComponent(
  () => import('../../pages/Help/HelpPage'),
  "Chargement de l'aide..."
);

export const LazyModerationPage = createLazyComponent(
  () => import('../../pages/Moderation/ModerationPage'),
  "Chargement de la modération..."
); 