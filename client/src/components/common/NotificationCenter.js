import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  IconButton,
  Badge,
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Box,
  Button,
  Divider,
  Chip,
  useTheme,
  Tooltip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import {
  Notifications,
  NotificationsActive,
  NotificationsOff,
  CheckCircle,
  Warning,
  Info,
  Error,
  Comment,
  Favorite,
  Share,
  Event,
  LocalHospital,
  Help,
  Security,
  Close,
  DoneAll,
  Delete,
  FilterList,
  Search,
  Settings,
  Refresh,
} from '@mui/icons-material';
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
} from '../../store/slices/notificationsSlice';
import notificationService from '../../services/notificationService';

const NotificationCenter = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  
  const notifications = useSelector(selectNotifications);
  const unreadCount = useSelector(selectUnreadCount);
  const isConnected = useSelector(selectIsConnected);
  const connectionStats = useSelector(selectConnectionStats);
  const permission = useSelector(selectPermission);
  const settings = useSelector(selectSettings);
  const notificationStats = useSelector(selectNotificationStats);
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);

  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    // Initialiser les notifications si l'utilisateur est connecté
    if (user && !isConnected) {
      dispatch(initializeNotifications({
        userId: user._id,
        token: localStorage.getItem('token')
      }));
      
      // Demander la permission pour les notifications
      requestNotificationPermission();
    }

    // Nettoyer à la déconnexion
    return () => {
      if (!user) {
        dispatch(disconnectNotifications());
      }
    };
  }, [user, isConnected, dispatch]);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await notificationService.requestPermission();
      dispatch(setPermission(permission ? 'granted' : 'denied'));
    }
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleMarkAsRead = (notificationId) => {
    dispatch(markAsReadServer(notificationId));
  };

  const handleMarkAllAsRead = () => {
    dispatch(markAllAsReadServer());
  };

  const handleRemoveNotification = (notificationId) => {
    dispatch(removeNotification(notificationId));
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_post':
        return <Comment color="primary" />;
      case 'new_comment':
        return <Comment color="info" />;
      case 'new_like':
        return <Favorite color="error" />;
      case 'new_alert':
        return <Warning color="error" />;
      case 'new_event':
        return <Event color="success" />;
      case 'help_request':
        return <Help color="warning" />;
      case 'moderation':
        return <Security color="error" />;
      case 'system':
        return <Info color="info" />;
      default:
        return <Notifications color="action" />;
    }
  };

  const getNotificationColor = (priority) => {
    switch (priority) {
      case 'high':
        return theme.palette.error.main;
      case 'normal':
        return theme.palette.primary.main;
      case 'low':
        return theme.palette.success.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const getFilteredNotifications = () => {
    switch (activeTab) {
      case 0: // Toutes
        return notifications;
      case 1: // Non lues
        return notifications.filter(n => !n.read);
      case 2: // Alertes
        return notifications.filter(n => n.type === 'new_alert');
      case 3: // Interactions
        return notifications.filter(n => ['new_comment', 'new_like', 'new_post'].includes(n.type));
      default:
        return notifications;
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)}h`;
    return date.toLocaleDateString();
  };

  const open = Boolean(anchorEl);
  const id = open ? 'notification-popover' : undefined;

  return (
    <>
      <Tooltip title="Notifications" arrow>
        <IconButton
          color="inherit"
          onClick={handleClick}
          sx={{ 
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 48,
            minHeight: 48,
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              transform: 'scale(1.05)',
            },
            '&:active': {
              transform: 'scale(0.95)',
            },
            transition: 'all 0.2s ease-in-out',
            // Styles de débogage pour s'assurer que le bouton est visible
            zIndex: 1000,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
          aria-describedby={id}
        >
          <Badge 
            badgeContent={unreadCount || 0} 
            color="error" 
            max={99}
            showZero={false}
            sx={{
              '& .MuiBadge-badge': {
                backgroundColor: '#f44336',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '0.75rem',
                minWidth: '20px',
                height: '20px',
                borderRadius: '10px',
              }
            }}
          >
            {isConnected ? (
              <NotificationsActive 
                sx={{ 
                  fontSize: 24,
                  color: theme.palette.primary.main,
                }} 
              />
            ) : (
              <Notifications 
                sx={{ 
                  fontSize: 24,
                  color: theme.palette.text.secondary,
                }} 
              />
            )}
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 600,
            overflow: 'hidden',
            boxShadow: theme.shadows[8],
            border: `1px solid ${theme.palette.divider}`,
          }
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="h6" component="h2">
              Notifications
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {unreadCount > 0 && (
                <Tooltip title="Marquer tout comme lu">
                  <IconButton size="small" onClick={handleMarkAllAsRead}>
                    <DoneAll />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Paramètres">
                <IconButton size="small">
                  <Settings />
                </IconButton>
              </Tooltip>
              <Tooltip title="Fermer">
                <IconButton size="small" onClick={handleClose}>
                  <Close />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Statistiques */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Chip 
              label={`${notificationStats?.total || 0} total`} 
              size="small" 
              variant="outlined"
            />
            <Chip 
              label={`${notificationStats?.unread || 0} non lues`} 
              size="small" 
              color="error"
            />
            {!isConnected && (
              <Chip 
                label="Déconnecté" 
                size="small" 
                color="warning"
                icon={<NotificationsOff />}
              />
            )}
          </Box>

          {/* Onglets */}
          <Tabs value={activeTab} onChange={handleTabChange} size="small">
            <Tab label="Toutes" />
            <Tab label="Non lues" />
            <Tab label="Alertes" />
            <Tab label="Interactions" />
          </Tabs>
        </Box>

        <Box sx={{ overflow: 'auto', maxHeight: 400 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : getFilteredNotifications().length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <NotificationsOff sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                {activeTab === 1 ? 'Aucune notification non lue' : 'Aucune notification'}
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {getFilteredNotifications().map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    sx={{
                      backgroundColor: notification.read ? 'transparent' : 'action.hover',
                      '&:hover': {
                        backgroundColor: 'action.selected',
                      },
                      cursor: 'pointer',
                    }}
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: getNotificationColor(notification.priority) }}>
                        {getNotificationIcon(notification.type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2" component="span">
                            {notification.title}
                          </Typography>
                          {!notification.read && (
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: 'primary.main',
                              }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {notification.message}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              {formatTimestamp(notification.timestamp)}
                            </Typography>
                            <Chip 
                              label={notification.priority} 
                              size="small" 
                              variant="outlined"
                              sx={{ height: 16, fontSize: '0.7rem' }}
                            />
                          </Box>
                        </Box>
                      }
                    />
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Supprimer">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveNotification(notification.id);
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </ListItem>
                  {index < getFilteredNotifications().length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>

        {/* Pied de page */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              {isConnected ? 'Connecté' : 'Déconnecté'}
            </Typography>
            <Button size="small" variant="text">
              Voir tout
            </Button>
          </Box>
        </Box>
      </Popover>
    </>
  );
};

export default NotificationCenter; 