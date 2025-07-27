import { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectNotifications,
  selectUnreadCount,
  selectIsConnected,
  selectConnectionStats,
  selectPermission,
  selectSettings,
  selectUnreadNotifications,
  selectNotificationsByType,
  selectHighPriorityNotifications,
  selectRecentNotifications,
  selectNotificationStats,
  initializeNotifications,
  markAsReadServer,
  markAllAsReadServer,
  removeNotification,
  updateSettings,
  setPermission,
  disconnectNotifications,
  addNotification,
  loadNotifications,
} from '../store/slices/notificationsSlice';
import notificationService from '../services/notificationService';

export const useNotifications = () => {
  const dispatch = useDispatch();
  
  // Sélecteurs Redux
  const notifications = useSelector(selectNotifications);
  const unreadCount = useSelector(selectUnreadCount);
  const isConnected = useSelector(selectIsConnected);
  const connectionStats = useSelector(selectConnectionStats);
  const permission = useSelector(selectPermission);
  const settings = useSelector(selectSettings);
  const notificationStats = useSelector(selectNotificationStats);
  const unreadNotifications = useSelector(selectUnreadNotifications);
  const highPriorityNotifications = useSelector(selectHighPriorityNotifications);
  const recentNotifications = useSelector(selectRecentNotifications);

  const { user } = useSelector((state) => state.auth);

  // Initialiser les notifications
  const initialize = useCallback((userId, token) => {
    dispatch(initializeNotifications({ userId, token }));
  }, [dispatch]);

  // Marquer comme lue
  const markAsRead = useCallback((notificationId) => {
    dispatch(markAsReadServer(notificationId));
  }, [dispatch]);

  // Marquer tout comme lu
  const markAllAsRead = useCallback(() => {
    dispatch(markAllAsReadServer());
  }, [dispatch]);

  // Supprimer une notification
  const remove = useCallback((notificationId) => {
    dispatch(removeNotification(notificationId));
  }, [dispatch]);

  // Mettre à jour les paramètres
  const updateNotificationSettings = useCallback((newSettings) => {
    dispatch(updateSettings(newSettings));
  }, [dispatch]);

  // Demander la permission
  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await notificationService.requestPermission();
      dispatch(setPermission(permission ? 'granted' : 'denied'));
      return permission;
    }
    return false;
  }, [dispatch]);

  // Rejoindre des rooms
  const joinRooms = useCallback((rooms) => {
    notificationService.joinRooms(rooms);
  }, []);

  // Quitter des rooms
  const leaveRooms = useCallback((rooms) => {
    notificationService.leaveRooms(rooms);
  }, []);

  // Mettre à jour la localisation
  const updateLocation = useCallback((location) => {
    notificationService.updateLocation(location);
  }, []);

  // Déconnecter
  const disconnect = useCallback(() => {
    dispatch(disconnectNotifications());
  }, [dispatch]);

  // Obtenir les notifications par type
  const getNotificationsByType = useCallback((type) => {
    return notifications.filter(n => n.type === type);
  }, [notifications]);

  // Obtenir les notifications par priorité
  const getNotificationsByPriority = useCallback((priority) => {
    return notifications.filter(n => n.priority === priority);
  }, [notifications]);

  // Rechercher dans les notifications
  const searchNotifications = useCallback((query) => {
    const lowercaseQuery = query.toLowerCase();
    return notifications.filter(n => 
      n.title.toLowerCase().includes(lowercaseQuery) ||
      n.message.toLowerCase().includes(lowercaseQuery)
    );
  }, [notifications]);

  // Formater le timestamp
  const formatTimestamp = useCallback((timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)}h`;
    return date.toLocaleDateString();
  }, []);

  // Obtenir l'icône de notification
  const getNotificationIcon = useCallback((type) => {
    switch (type) {
      case 'new_post':
        return 'comment';
      case 'new_comment':
        return 'comment';
      case 'new_like':
        return 'favorite';
      case 'new_alert':
        return 'warning';
      case 'new_event':
        return 'event';
      case 'help_request':
        return 'help';
      case 'moderation':
        return 'security';
      case 'system':
        return 'info';
      default:
        return 'notifications';
    }
  }, []);

  // Obtenir la couleur de priorité
  const getPriorityColor = useCallback((priority) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'normal':
        return 'primary';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  }, []);

  // Initialisation automatique
  useEffect(() => {
    if (user && !isConnected) {
      initialize(user._id, localStorage.getItem('token'));
      requestPermission();
    }

    return () => {
      if (!user) {
        disconnect();
      }
    };
  }, [user, isConnected, initialize, requestPermission, disconnect]);

  // Écouter les événements du service
  useEffect(() => {
    const handleNewNotification = (data) => {
      dispatch(addNotification(data.notification));
    };

    const handleNotificationsLoaded = (data) => {
      dispatch(loadNotifications(data));
    };

    const handleConnectionStatus = (connected) => {
      // Mettre à jour le statut de connexion si nécessaire
    };

    // S'abonner aux événements
    notificationService.on('new_notification', handleNewNotification);
    notificationService.on('notifications_loaded', handleNotificationsLoaded);
    notificationService.on('connection_status', handleConnectionStatus);

    // Nettoyer les abonnements
    return () => {
      notificationService.off('new_notification', handleNewNotification);
      notificationService.off('notifications_loaded', handleNotificationsLoaded);
      notificationService.off('connection_status', handleConnectionStatus);
    };
  }, [dispatch]);

  return {
    // État
    notifications,
    unreadCount,
    isConnected,
    connectionStats,
    permission,
    settings,
    notificationStats,
    unreadNotifications,
    highPriorityNotifications,
    recentNotifications,

    // Actions
    initialize,
    markAsRead,
    markAllAsRead,
    remove,
    updateNotificationSettings,
    requestPermission,
    joinRooms,
    leaveRooms,
    updateLocation,
    disconnect,

    // Utilitaires
    getNotificationsByType,
    getNotificationsByPriority,
    searchNotifications,
    formatTimestamp,
    getNotificationIcon,
    getPriorityColor,
  };
}; 