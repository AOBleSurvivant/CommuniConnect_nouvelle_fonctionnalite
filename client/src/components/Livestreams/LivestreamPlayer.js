import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Button,
  Chip,
  Avatar,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Paper,
  Badge,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Close as CloseIcon,
  Send as SendIcon,
  Report as ReportIcon,
  LiveTv as LiveTvIcon,
  Group as GroupIcon,
  Chat as ChatIcon,
  Videocam as VideocamIcon,
  Stop as StopIcon,
  PlayArrow as PlayArrowIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Warning as WarningIcon,
  Event as EventIcon,
  TrendingUp as TrendingIcon,
  NearMe as NearMeIcon,
  FavoriteBorder as FavoriteBorderIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  joinLivestream,
  leaveLivestream,
  sendMessage,
  addReaction,
  reportLivestream,
  startLivestream,
  endLivestream
} from '../../store/slices/livestreamsSlice';

const LivestreamPlayer = ({ livestream, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useDispatch();
  
  const { user } = useSelector(state => state.auth);
  const { loading, error } = useSelector(state => state.livestreams);

  const [message, setMessage] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewerCount, setViewerCount] = useState(livestream.stats?.currentViewers || 0);

  const chatRef = useRef(null);
  const videoRef = useRef(null);

  // Auto-scroll du chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [livestream.messages]);

  // Rejoindre automatiquement le live
  useEffect(() => {
    if (livestream.status === 'live' && !isJoined) {
      handleJoin();
    }
  }, [livestream.status]);

  const handleJoin = async () => {
    try {
      await dispatch(joinLivestream(livestream._id)).unwrap();
      setIsJoined(true);
      setViewerCount(prev => prev + 1);
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
    }
  };

  const handleLeave = async () => {
    try {
      await dispatch(leaveLivestream(livestream._id)).unwrap();
      setIsJoined(false);
      setViewerCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !isJoined) return;

    try {
      await dispatch(sendMessage({ id: livestream._id, message: message.trim() })).unwrap();
      setMessage('');
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
    }
  };

  const handleReaction = async (reactionType) => {
    if (!isJoined) return;

    try {
      await dispatch(addReaction({ id: livestream._id, reactionType })).unwrap();
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la réaction:', error);
    }
  };

  const handleReport = async () => {
    try {
      await dispatch(reportLivestream({ id: livestream._id, reason: 'inappropriate' })).unwrap();
    } catch (error) {
      console.error('Erreur lors du signalement:', error);
    }
  };

  const handleStartBroadcast = async () => {
    try {
      await dispatch(startLivestream(livestream._id)).unwrap();
      setIsBroadcasting(true);
    } catch (error) {
      console.error('Erreur lors du démarrage du live:', error);
    }
  };

  const handleStopBroadcast = async () => {
    try {
      await dispatch(endLivestream(livestream._id)).unwrap();
      setIsBroadcasting(false);
    } catch (error) {
      console.error('Erreur lors de l\'arrêt du live:', error);
    }
  };

  const handleClose = () => {
    if (isJoined) {
      handleLeave();
    }
    onClose();
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'alert':
        return <WarningIcon color="error" />;
      case 'event':
        return <EventIcon color="primary" />;
      case 'meeting':
        return <GroupIcon color="info" />;
      case 'sensitization':
        return <TrendingIcon color="secondary" />;
      case 'community':
        return <NearMeIcon color="success" />;
      default:
        return <VideocamIcon />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'alert':
        return 'Alerte';
      case 'event':
        return 'Événement';
      case 'meeting':
        return 'Réunion';
      case 'sensitization':
        return 'Sensibilisation';
      case 'community':
        return 'Communautaire';
      default:
        return 'Live';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'low':
        return 'success';
      case 'medium':
        return 'warning';
      case 'high':
        return 'error';
      case 'critical':
        return 'error';
      default:
        return 'default';
    }
  };

  const getUrgencyLabel = (urgency) => {
    switch (urgency) {
      case 'low':
        return 'Faible';
      case 'medium':
        return 'Moyenne';
      case 'high':
        return 'Élevée';
      case 'critical':
        return 'Critique';
      default:
        return 'Normale';
    }
  };

  const formatTime = (date) => {
    if (!date) return '';
    return formatDistanceToNow(new Date(date), { 
      addSuffix: true, 
      locale: fr 
    });
  };

  const getLocationText = () => {
    const { location } = livestream;
    if (!location) return '';
    
    const parts = [];
    if (location.quartier) parts.push(location.quartier);
    if (location.commune) parts.push(location.commune);
    
    return parts.join(', ');
  };

  const isAuthor = user?._id === livestream.author?._id;

  return (
    <Dialog
      open={true}
      onClose={handleClose}
      maxWidth="xl"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
          height: isMobile ? '100vh' : '90vh',
          maxHeight: isMobile ? '100vh' : '90vh'
        }
      }}
    >
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* En-tête */}
        <Box sx={{ 
          p: 2, 
          borderBottom: 1, 
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: livestream.status === 'live' ? 'error.main' : 'background.paper',
          color: livestream.status === 'live' ? 'white' : 'inherit'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <LiveTvIcon />
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {livestream.title}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                {getLocationText()}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              icon={getTypeIcon(livestream.type)}
              label={getTypeLabel(livestream.type)}
              size="small"
              variant="outlined"
              sx={{ color: 'inherit', borderColor: 'currentColor' }}
            />
            {livestream.urgency && livestream.urgency !== 'medium' && (
              <Chip
                label={getUrgencyLabel(livestream.urgency)}
                color={getUrgencyColor(livestream.urgency)}
                size="small"
              />
            )}
            <IconButton onClick={handleClose} color="inherit">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Contenu principal */}
        <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Zone vidéo */}
          <Box sx={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column',
            bgcolor: 'black',
            position: 'relative'
          }}>
            {/* Placeholder vidéo */}
            <Box sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'grey.900',
              position: 'relative'
            }}>
              {livestream.status === 'live' ? (
                <Box sx={{ textAlign: 'center', color: 'white' }}>
                  <LiveTvIcon sx={{ fontSize: 64, mb: 2 }} />
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    EN DIRECT
                  </Typography>
                  <Typography variant="body1">
                    {livestream.author?.firstName} {livestream.author?.lastName}
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', color: 'white' }}>
                  <VideocamIcon sx={{ fontSize: 64, mb: 2 }} />
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    {livestream.status === 'scheduled' ? 'PROGRAMMÉ' : 'TERMINÉ'}
                  </Typography>
                  <Typography variant="body1">
                    {livestream.status === 'scheduled' 
                      ? `Démarre ${formatTime(livestream.scheduledAt)}`
                      : `Terminé ${formatTime(livestream.endedAt)}`
                    }
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Contrôles vidéo */}
            <Box sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              p: 2,
              background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Badge badgeContent={viewerCount} color="primary">
                  <GroupIcon sx={{ color: 'white' }} />
                </Badge>
                <Typography variant="body2" sx={{ color: 'white' }}>
                  {viewerCount} spectateur{viewerCount > 1 ? 's' : ''}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {isAuthor && livestream.status === 'scheduled' && (
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<PlayArrowIcon />}
                    onClick={handleStartBroadcast}
                    disabled={loading}
                    size="small"
                  >
                    Démarrer
                  </Button>
                )}
                
                {isAuthor && livestream.status === 'live' && (
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<StopIcon />}
                    onClick={handleStopBroadcast}
                    disabled={loading}
                    size="small"
                  >
                    Arrêter
                  </Button>
                )}

                <IconButton 
                  onClick={() => setIsMuted(!isMuted)}
                  sx={{ color: 'white' }}
                >
                  {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
                </IconButton>

                <IconButton 
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  sx={{ color: 'white' }}
                >
                  {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                </IconButton>
              </Box>
            </Box>
          </Box>

          {/* Chat */}
          {showChat && (
            <Box sx={{ 
              width: isMobile ? '100%' : 350, 
              borderLeft: isMobile ? 0 : 1,
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* En-tête du chat */}
              <Box sx={{ 
                p: 2, 
                borderBottom: 1, 
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <Typography variant="h6" fontWeight="bold">
                  Chat en direct
                </Typography>
                <Badge badgeContent={livestream.messages?.length || 0} color="primary">
                  <ChatIcon />
                </Badge>
              </Box>

              {/* Messages */}
              <Box 
                ref={chatRef}
                sx={{ 
                  flex: 1, 
                  overflowY: 'auto',
                  p: 1
                }}
              >
                {livestream.messages?.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <ChatIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                      Aucun message pour le moment
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Soyez le premier à commenter !
                    </Typography>
                  </Box>
                ) : (
                  <List sx={{ py: 0 }}>
                    {livestream.messages?.map((msg, index) => (
                      <ListItem key={index} sx={{ px: 1, py: 0.5 }}>
                        <ListItemAvatar sx={{ minWidth: 32 }}>
                          <Avatar 
                            sx={{ width: 24, height: 24 }}
                            src={msg.user?.avatar}
                          >
                            {msg.user?.firstName?.[0]}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="caption" fontWeight="bold">
                                {msg.user?.firstName} {msg.user?.lastName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatTime(msg.timestamp)}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              {msg.message}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>

              {/* Actions */}
              <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <IconButton 
                    size="small"
                    onClick={() => handleReaction('like')}
                    color="primary"
                  >
                    <FavoriteBorderIcon />
                  </IconButton>
                  <IconButton 
                    size="small"
                    onClick={() => handleReaction('love')}
                    color="secondary"
                  >
                    ❤️
                  </IconButton>
                  <IconButton 
                    size="small"
                    onClick={() => handleReaction('alert')}
                    color="warning"
                  >
                    ⚠️
                  </IconButton>
                  <IconButton 
                    size="small"
                    onClick={handleReport}
                  >
                    <ReportIcon />
                  </IconButton>
                </Box>

                {/* Envoi de message */}
                <Box component="form" onSubmit={handleSendMessage} sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder={isJoined ? "Tapez votre message..." : "Rejoignez le live pour commenter"}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={!isJoined}
                    InputProps={{
                      endAdornment: (
                        <IconButton 
                          type="submit" 
                          disabled={!message.trim() || !isJoined}
                          size="small"
                        >
                          <SendIcon />
                        </IconButton>
                      )
                    }}
                  />
                </Box>

                {!isJoined && livestream.status === 'live' && (
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleJoin}
                    disabled={loading}
                    sx={{ mt: 1 }}
                  >
                    Rejoindre le live
                  </Button>
                )}
              </Box>
            </Box>
          )}
        </Box>

        {/* Bouton toggle chat pour mobile */}
        {isMobile && (
          <Box sx={{ position: 'fixed', bottom: 16, right: 16 }}>
            <IconButton
              color="primary"
              onClick={() => setShowChat(!showChat)}
              sx={{ 
                bgcolor: 'background.paper',
                boxShadow: 2,
                '&:hover': { bgcolor: 'background.paper' }
              }}
            >
              <ChatIcon />
            </IconButton>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LivestreamPlayer; 